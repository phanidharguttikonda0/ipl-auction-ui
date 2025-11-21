import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { ParticipantState } from "../types";
import { rtcConfig } from "../utils/webrtcConfig";

type RemoteStreamMap = Record<string, MediaStream>;
type RemoteMuteMap = Record<string, boolean>;

interface UseAuctionAudioProps {
    participantId: number;
    participants: Map<number, ParticipantState>;
    sendSignalMessage?: (payload: unknown) => void;
    registerSignalHandler?: (
        handler: (message: any) => boolean
    ) => (() => void) | undefined;
    enabled?: boolean;
}

export const useAuctionAudio = ({
                                     participantId,
                                     participants,
                                     sendSignalMessage,
                                     registerSignalHandler,
                                     enabled = true,
                                 }: UseAuctionAudioProps) => {
    const selfId = participantId.toString();
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<RemoteStreamMap>({});
    const [isJoined, setIsJoined] = useState(false);
    const [localMuted, setLocalMuted] = useState(false);
    const [remoteMuteMap, setRemoteMuteMap] = useState<RemoteMuteMap>({});
    const [error, setError] = useState<string | null>(null);

    const sendSignal = useCallback(
        (payload: unknown) => {
            if (!sendSignalMessage) {
                console.warn("Attempted to send signal before websocket ready");
                return;
            }
            console.log("[audio] ➡️", payload);
            sendSignalMessage(payload);
        },
        [sendSignalMessage]
    );

    const cleanupPeer = useCallback((remoteId: string) => {
        const pc = peersRef.current.get(remoteId);
        if (pc) {
            pc.ontrack = null;
            pc.onicecandidate = null;
            pc.onconnectionstatechange = null;
            pc.close();
        }
        peersRef.current.delete(remoteId);
        setRemoteStreams((prev) => {
            if (!prev[remoteId]) return prev;
            const next = { ...prev };
            delete next[remoteId];
            return next;
        });
    }, []);

    const handleMuteBroadcast = useCallback((fromId: string, muted: boolean) => {
        setRemoteMuteMap((prev) => {
            if (prev[fromId] === muted) return prev;
            return { ...prev, [fromId]: muted };
        });
    }, []);

    const createPeerConnection = useCallback(
        (remoteId: string) => {
            if (!localStream) {
                console.warn("Attempted to create peer without local stream");
                return null;
            }
            const existing = peersRef.current.get(remoteId);
            if (existing) {
                return existing;
            }

            const pc = new RTCPeerConnection(rtcConfig);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendSignal({
                        type: "ice-candidate",
                        from: Number(selfId),
                        to: Number(remoteId),
                        payload: {
                            candidate: event.candidate.candidate,
                            sdpMid: event.candidate.sdpMid,
                            sdpMLineIndex: event.candidate.sdpMLineIndex,
                        },
                    });
                }
            };

            pc.ontrack = (event) => {
                const [stream] = event.streams;
                if (!stream) {
                    console.warn("Received remote track without stream", event);
                    return;
                }
                setRemoteStreams((prev) => ({ ...prev, [remoteId]: stream }));
            };

            pc.onconnectionstatechange = () => {
                const state = pc.connectionState;
                console.log(`[audio] peer ${remoteId} state: ${state}`);
                if (
                    state === "failed" ||
                    state === "closed" ||
                    state === "disconnected"
                ) {
                    cleanupPeer(remoteId);
                }
            };

            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });

            peersRef.current.set(remoteId, pc);
            return pc;
        },
        [cleanupPeer, localStream, sendSignal, selfId]
    );

    const createOfferFor = useCallback(
        async (remoteId: string) => {
            const pc = createPeerConnection(remoteId);
            if (!pc) return;
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal({
                    type: "offer",
                    from: Number(selfId),
                    to: Number(remoteId),
                    payload: {
                        type: offer.type ?? "offer",
                        sdp: offer.sdp ?? "",
                    },
                });
            } catch (err) {
                console.error("Failed to create offer", err);
            }
        },
        [createPeerConnection, sendSignal, selfId]
    );

    const handleOffer = useCallback(
        async (message: any) => {
            const { from, payload } = message;
            if (!payload?.sdp || !payload?.type) return true;
            const remoteId = String(from);
            const pc = createPeerConnection(remoteId);
            if (!pc) return true;
            const desc: RTCSessionDescriptionInit = {
                type: payload.type,
                sdp: payload.sdp,
            };
            try {
                await pc.setRemoteDescription(desc);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal({
                    type: "answer",
                    from: Number(selfId),
                    to: Number(remoteId),
                    payload: {
                        type: answer.type ?? "answer",
                        sdp: answer.sdp ?? "",
                    },
                });
            } catch (error) {
                console.error("Failed to handle offer", error);
            }
            return true;
        },
        [createPeerConnection, sendSignal, selfId]
    );

    const handleAnswer = useCallback(
        async (message: any) => {
            const { from, payload } = message;
            if (!payload?.sdp || !payload?.type) return true;
            const pc = peersRef.current.get(String(from));
            if (!pc) {
                console.warn("Answer received for unknown peer", from);
                return true;
            }
            try {
                const desc: RTCSessionDescriptionInit = {
                    type: payload.type,
                    sdp: payload.sdp,
                };
                await pc.setRemoteDescription(desc);
            } catch (error) {
                console.error("Failed to handle answer", error);
            }
            return true;
        },
        []
    );

    const handleIceCandidate = useCallback(async (message: any) => {
        const { from, payload } = message;
        if (!payload?.candidate) return true;
        const pc = peersRef.current.get(String(from));
        if (!pc) {
            console.warn("ICE candidate for unknown peer", from);
            return true;
        }
        try {
            await pc.addIceCandidate({
                candidate: payload.candidate,
                sdpMid: payload.sdpMid ?? payload.sdp_mid ?? undefined,
                sdpMLineIndex:
                    payload.sdpMLineIndex ?? payload.sdp_mline_index ?? undefined,
            });
        } catch (error) {
            console.error("Failed to add ICE candidate", error);
        }
        return true;
    }, []);

    const handleSignalMessage = useCallback(
        (message: any) => {
            if (!message || typeof message !== "object" || !message.type) {
                return false;
            }

            const targeted =
                message.to === undefined ||
                Number(message.to) === Number(participantId);

            if (
                ["offer", "answer", "ice-candidate"].includes(message.type) &&
                !targeted
            ) {
                return false;
            }

            switch (message.type) {
                case "offer":
                    return handleOffer(message);
                case "answer":
                    return handleAnswer(message);
                case "ice-candidate":
                    return handleIceCandidate(message);
                case "mute": {
                    const target = message.participantId ?? message.from;
                    if (target !== undefined) {
                        handleMuteBroadcast(String(target), true);
                        return true;
                    }
                    return false;
                }
                case "unmute": {
                    const target = message.participantId ?? message.from;
                    if (target !== undefined) {
                        handleMuteBroadcast(String(target), false);
                        return true;
                    }
                    return false;
                }
                default:
                    return false;
            }
        },
        [
            handleAnswer,
            handleIceCandidate,
            handleMuteBroadcast,
            handleOffer,
            participantId,
        ]
    );

    useEffect(() => {
        if (!registerSignalHandler) return;
        const unregister = registerSignalHandler(handleSignalMessage);
        return () => {
            unregister?.();
        };
    }, [handleSignalMessage, registerSignalHandler]);

    const joinAudio = useCallback(async () => {
        if (!enabled) return;
        if (isJoined) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            stream.getAudioTracks().forEach((track) => {
                track.enabled = !localMuted;
            });
            setLocalStream(stream);
            setIsJoined(true);
            setError(null);
        } catch (err) {
            console.error("Failed to get microphone access", err);
            setError("Microphone permission denied or unavailable");
        }
    }, [enabled, isJoined, localMuted]);

    const leaveAudio = useCallback(() => {
        peersRef.current.forEach((_pc, id) => cleanupPeer(id));
        peersRef.current.clear();
        setRemoteStreams({});
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        setLocalStream(null);
        setIsJoined(false);
    }, [cleanupPeer, localStream]);

    const toggleMute = useCallback(() => {
        if (!localStream) return;
        const next = !localMuted;
        localStream.getAudioTracks().forEach((track) => {
            track.enabled = !next;
        });
        setLocalMuted(next);
        handleMuteBroadcast(selfId, next);
        sendSignal({
            type: next ? "mute" : "unmute",
            participantId: Number(selfId),
        });
    }, [handleMuteBroadcast, localMuted, localStream, sendSignal, selfId]);

    useEffect(() => {
        if (!isJoined || !localStream) return;
        participants.forEach((participant) => {
            if (participant.participant_id === participantId) return;
            if (participant.connected === false) return;
            const remoteId = participant.participant_id.toString();
            if (peersRef.current.has(remoteId)) return;

            const shouldInitiate =
                Number(participantId) < Number(participant.participant_id);
            const pc = createPeerConnection(remoteId);
            if (pc && shouldInitiate) {
                createOfferFor(remoteId);
            }
        });
    }, [
        createOfferFor,
        createPeerConnection,
        isJoined,
        localStream,
        participantId,
        participants,
    ]);

    useEffect(() => {
        if (!participants.size) return;
        const activeIds = new Set(
            Array.from(participants.values())
                .filter((p) => p.connected !== false)
                .map((p) => p.participant_id.toString())
        );
        peersRef.current.forEach((_pc, id) => {
            if (!activeIds.has(id)) {
                cleanupPeer(id);
            }
        });
    }, [cleanupPeer, participants]);

    useEffect(
        () => () => {
            leaveAudio();
        },
        [leaveAudio]
    );

    const remoteStreamsList = useMemo(
        () => Object.entries(remoteStreams),
        [remoteStreams]
    );

    return {
        joinAudio,
        leaveAudio,
        toggleMute,
        isJoined,
        localMuted,
        remoteMuteMap,
        remoteStreams,
        remoteStreamsList,
        error,
    };
};

