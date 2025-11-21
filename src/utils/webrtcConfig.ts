export const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    {
        urls: "turn:13.127.9.28:3478",
        username: "turnuser",
        credential: "turnpassword",
    },
];

export const rtcConfig: RTCConfiguration = {
    iceServers,
    iceTransportPolicy: "all",
    bundlePolicy: "balanced",
};

