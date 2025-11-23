// src/hooks/useAuctionAudio.ts
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

interface UseAuctionAudioProps {
  participantId: number;
  participants: Map<number, ParticipantState>;
  sendSignalMessage?: (payload: unknown) => void; // json signaling
  sendTextMessage?: (msg: string) => void; // plain text messages like "mute"/"unmute"
  registerSignalHandler?: (
    handler: (message: any) => boolean
  ) => (() => void) | undefined;
  connected?: boolean;
  enabled?: boolean;
}

export const useAuctionAudio = ({
  participantId,
  participants,
  sendSignalMessage,
  sendTextMessage,
  registerSignalHandler,
  connected = false,
  enabled = true,
}: UseAuctionAudioProps) => {
  const selfId = participantId.toString();

  // ---- refs for media & peers ----
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioInitTimeRef = useRef<number | null>(null);

  // ---- UI / logical state ----
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamMap>({});
  const [isJoined, setIsJoined] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------
  // SIGNALING SEND HELPER (for SDP / ICE only)
  // -------------------------------------
  const sendSignal = useCallback(
    (payload: unknown) => {
      if (!sendSignalMessage) {
        console.warn("[audio] Tried to send signal before websocket ready", payload);
        return;
      }
      console.log("[audio] ➡️ sending signaling payload:", payload);
      sendSignalMessage(payload);
    },
    [sendSignalMessage],
  );

  // -------------------------------------
  // CLEANUP SINGLE PEER
  // -------------------------------------
  const cleanupPeer = useCallback((remoteId: string) => {
    const pc = peersRef.current.get(remoteId);
    if (pc) {
      console.log(`[audio] Cleaning up peer connection for ${remoteId}`);
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.onnegotiationneeded = null;
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

  // -------------------------------------
  // CREATE PEER CONNECTION
  // -------------------------------------
  const createPeerConnection = useCallback(
    (remoteId: string) => {
      const localStream = localStreamRef.current;
      if (!localStream) {
        console.warn("[audio] Attempted to create peer without local stream");
        return null;
      }

      const existing = peersRef.current.get(remoteId);
      if (existing) {
        console.log(`[audio] Reusing existing RTCPeerConnection for ${remoteId}`);
        return existing;
      }

      console.log("[audio] Creating new RTCPeerConnection for", remoteId);
      const pc = new RTCPeerConnection(rtcConfig);

      // ICE
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const payload = {
          type: "ice-candidate",
          from: Number(selfId),
          to: Number(remoteId),
          payload: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        };
        sendSignal(payload);
      };

      // Remote track
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        console.log(`[audio] Received remote audio stream from ${remoteId}`);
        setRemoteStreams((prev) => ({ ...prev, [remoteId]: stream }));
      };

      // State change
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`[audio] peer ${remoteId} state: ${state}`);
        if (state === "failed" || state === "closed" || state === "disconnected") {
          cleanupPeer(remoteId);
        }
      };

      // Negotiation (defensive)
      pc.onnegotiationneeded = async () => {
        console.log("[audio] negotiationneeded fired for", remoteId);
        if (pc.signalingState !== "stable") return;
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
        } catch (e) {
          console.error("[audio] negotiationneeded error:", e);
        }
      };

      // Add local tracks once
      localStream.getTracks().forEach((track) => {
        console.log(
          `[audio] Adding local ${track.kind} track to peer ${remoteId}, enabled=${track.enabled}`,
        );
        pc.addTrack(track, localStream);
      });

      peersRef.current.set(remoteId, pc);
      return pc;
    },
    [cleanupPeer, sendSignal, selfId],
  );

  // -------------------------------------
  // CREATE OFFER
  // -------------------------------------
  const createOfferFor = useCallback(
    async (remoteId: string) => {
      console.log("[audio] createOfferFor CALLED for", remoteId);
      const pc = createPeerConnection(remoteId);
      if (!pc) return;

      try {
        console.log("[audio] Creating offer for", remoteId, "state=", pc.signalingState);
        const offer = await pc.createOffer();
        console.log("[audio] Got local offer for", remoteId);
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
        console.error("[audio] Failed to create/send offer to", remoteId, err);
      }
    },
    [createPeerConnection, sendSignal, selfId],
  );

  // -------------------------------------
  // HANDLE OFFER
  // -------------------------------------
  const handleOffer = useCallback(
    async (message: any) => {
      const { from, payload } = message;
      if (!payload?.sdp || !payload?.type) return true;

      const remoteId = String(from);
      console.log("[audio] Received OFFER from", remoteId);

      const pc = createPeerConnection(remoteId);
      if (!pc) return true;

      await pc.setRemoteDescription({
        type: payload.type,
        sdp: payload.sdp,
      });

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

      return true;
    },
    [createPeerConnection, sendSignal, selfId],
  );

  // -------------------------------------
  // HANDLE ANSWER
  // -------------------------------------
  const handleAnswer = useCallback(async (message: any) => {
    const { from, payload } = message;
    if (!payload?.sdp) return true;

    const remoteId = String(from);
    const pc = peersRef.current.get(remoteId);
    if (!pc) {
      console.warn("[audio] Answer received for unknown peer", remoteId);
      return true;
    }

    console.log("[audio] Received ANSWER from", remoteId);

    await pc.setRemoteDescription({
      type: payload.type,
      sdp: payload.sdp,
    });

    return true;
  }, []);

  // -------------------------------------
  // HANDLE ICE CANDIDATE
  // -------------------------------------
  const handleIceCandidate = useCallback(async (message: any) => {
    const { from, payload } = message;
    if (!payload?.candidate) return true;

    const remoteId = String(from);
    const pc = peersRef.current.get(remoteId);
    if (!pc) {
      console.warn("[audio] ICE candidate for unknown peer", remoteId);
      return true;
    }

    console.log("[audio] Received ICE candidate from", remoteId);

    await pc.addIceCandidate({
      candidate: payload.candidate,
      sdpMid: payload.sdpMid,
      sdpMLineIndex: payload.sdpMLineIndex,
    });

    return true;
  }, []);

  // -------------------------------------
  // REGISTER SIGNAL HANDLER WITH WS HOOK
  // -------------------------------------
  const signalHandlerRef = useRef<(msg: any) => boolean>(() => false);
  signalHandlerRef.current = (msg) => {
    if (!msg || typeof msg !== "object") return false;
    if (!["offer", "answer", "ice-candidate"].includes(msg.type)) return false;

    if (msg.to !== undefined && Number(msg.to) !== Number(participantId)) {
      return false;
    }

    switch (msg.type) {
      case "offer":
        return handleOffer(msg);
      case "answer":
        return handleAnswer(msg);
      case "ice-candidate":
        return handleIceCandidate(msg);
      default:
        return false;
    }
  };

  useEffect(() => {
    if (!registerSignalHandler) {
      console.error("[audio] registerSignalHandler missing");
      return;
    }
    console.log("[audio] Registering signal handler…");
    const unregister = registerSignalHandler((msg) =>
      signalHandlerRef.current(msg),
    );
    return () => {
      unregister?.();
    };
  }, [registerSignalHandler]);

  // -------------------------------------
  // JOIN AUDIO (AUTO-JOIN ONCE AFTER CONNECTED)
  // -------------------------------------
  const joinAudio = useCallback(async () => {
    if (!enabled) return;
    if (isJoined) return;

    try {
      console.log("[audio] Requesting microphone access…");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      stream.getAudioTracks().forEach((track) => {
        track.enabled = !localMuted;
      });

      localStreamRef.current = stream;
      setIsJoined(true);
      setError(null);
      audioInitTimeRef.current = Date.now();

      console.log("[audio] Successfully joined audio room");
    } catch (err) {
      console.error("[audio] Failed to get microphone access", err);
      setError("Microphone permission denied or unavailable");
    }
  }, [enabled, isJoined, localMuted]);

  // Auto-join after WS connected
  useEffect(() => {
    if (!enabled) return;
    if (!connected) return;
    if (isJoined) return;

    console.log("[audio] Auto-joining audio room...");
    joinAudio();
  }, [enabled, connected, isJoined, joinAudio]);

  // -------------------------------------
  // LEAVE AUDIO (ONLY ON UNMOUNT OR MANUAL)
  // -------------------------------------
  const leaveAudio = useCallback(() => {
    console.log("[audio] Leaving audio room…");

    peersRef.current.forEach((_pc, id) => cleanupPeer(id));
    peersRef.current.clear();

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    localStreamRef.current = null;

    setIsJoined(false);
  }, [cleanupPeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveAudio();
    };
  }, [leaveAudio]);

  // -------------------------------------
  // LOCAL-ONLY MUTE / UNMUTE
  // -------------------------------------
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const next = !localMuted;
    // update tracks locally
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });

    // also ensure sender tracks reflect enabled state
    peersRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = !next;
        }
      });
    });

    setLocalMuted(next);
    console.log(`[audio] ${next ? "Muted" : "Unmuted"} microphone`);

    // send plain text "mute" or "unmute" to WS (which backend will broadcast as mute-<id>)
    try {
      if (next) {
        sendTextMessage?.("mute");
      } else {
        sendTextMessage?.("unmute");
      }
    } catch (e) {
      console.warn("[audio] failed sending mute/unmute text message", e);
    }
  }, [localMuted, sendTextMessage]);

  // -------------------------------------
  // ENSURE PEERS FOR ALL ACTIVE PARTICIPANTS
  // -------------------------------------
  useEffect(() => {
    if (!isJoined) return;
    if (!localStreamRef.current) return;

    const sinceJoin = audioInitTimeRef.current ? Date.now() - audioInitTimeRef.current : Infinity;
    const allowCleanup = sinceJoin > 1500;

    console.log(
      "[audio] Participant list updated, ensuring peers exist. Current participants:",
      Array.from(participants.keys()),
    );

    // Create peers for active participants
    participants.forEach((participant, id) => {
      if (id === participantId) return;
      if (participant.connected === false) return;

      const remoteId = id.toString();
      if (!peersRef.current.has(remoteId)) {
        console.log("[audio] No peer yet for", remoteId, "→ creating & sending offer");
        const pc = createPeerConnection(remoteId);
        if (pc) {
          void createOfferFor(remoteId);
        }
      }
    });

    // Cleanup peers for inactive participants (after small grace period)
    if (allowCleanup) {
      const activeIds = new Set(
        Array.from(participants.values())
          .filter((p) => p.connected !== false)
          .map((p) => p.participant_id.toString()),
      );

      peersRef.current.forEach((_pc, id) => {
        if (!activeIds.has(id)) {
          console.log("[audio] Cleaning up peer for inactive participant", id);
          cleanupPeer(id);
        }
      });
    }
  }, [
    isJoined,
    participantId,
    participants,
    createPeerConnection,
    createOfferFor,
    cleanupPeer,
  ]);

  // -------------------------------------
  // REMOTE STREAMS ARRAY FORM
  // -------------------------------------
  const remoteStreamsList = useMemo(
    () => Object.entries(remoteStreams),
    [remoteStreams],
  );

  return {
    joinAudio,
    leaveAudio,
    toggleMute,
    isJoined,
    localMuted,
    remoteStreams,
    remoteStreamsList,
    error,
  };
};
