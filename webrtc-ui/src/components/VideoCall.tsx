import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client"

const socket = io("http://localhost:3000");
const servers = {
    iceServers: [{
        urls: "stun:stun.l.google.com:19302",
    }]
};

export const VideoCall = () => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        const init = async () => {
            // Start local stream:
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            };

            // Create P2P connection:
            const pc = new RTCPeerConnection(servers);
            setPeerConnection(pc);

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            // Handle ICE Candidates:
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice-candidate", { roomId: "room1", candidate: event.candidate });
                }
            };

            // Join Room:
            socket.emit("join", "room1");

            // Socket Listeners:
            socket.on("user-joined", async () => {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("offer", { roomId: "room1", offer });
            });

            socket.on("offer", async ({ offer }) => {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("answer", { roomId: "room1", answer });
            });

            socket.on("answer", async ({ answer }) => {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on("ice-candidate", async ({ candidate }) => {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error("Error adding received candidate:", error);
                }
            });
        };

        init();
    }, []);
    return (
        <div className="flex gap-[20px]">
            Local
            <video ref={localVideoRef} autoPlay playsInline muted className="w-[300px]"/>
            Remote
            <video ref={remoteVideoRef} autoPlay playsInline className="w-[300px]"/>
        </div>
    )
}