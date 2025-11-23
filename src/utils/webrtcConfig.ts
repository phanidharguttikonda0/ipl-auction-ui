export const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    {
        urls: "turn:3.108.59.36:3478",
        username: "phani",
        credential: "turnpassword123",
    },
];

export const rtcConfig: RTCConfiguration = {
    iceServers,
    iceTransportPolicy: "all",
    bundlePolicy: "balanced",
};

