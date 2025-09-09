import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", { transports: ["websocket"] });

const servers: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
  iceCandidatePoolSize: 10,
};

export const VideoCall = () => {
  const startButton = useRef<HTMLButtonElement>(null);
  const hangupButton = useRef<HTMLButtonElement>(null);
  const muteAudButton = useRef<HTMLButtonElement>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [audioState, setAudioState] = useState(false);

  useEffect(() => {
    if (hangupButton.current) hangupButton.current.disabled = true;
    if (muteAudButton.current) muteAudButton.current.disabled = true;

    socket.on("message", async (e: any) => {
      if (!localStream) {
        console.log("not ready yet");
        return;
      }
      switch (e.type) {
        case "offer":
          await handleOffer(e);
          break;
        case "answer":
          await handleAnswer(e);
          break;
        case "candidate":
          await handleCandidate(e);
          break;
        case "ready":
          if (pc) {
            console.log("already in call, ignoring");
            return;
          }
          await makeCall();
          break;
        case "bye":
          if (pc) {
            hangup();
          }
          break;
        default:
          console.log("unhandled", e);
          break;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, pc]);

  const makeCall = async () => {
    try {
      const peer = new RTCPeerConnection(servers);
      setPc(peer);

      peer.onicecandidate = (e) => {
        const message: any = { type: "candidate", candidate: null };
        if (e.candidate) {
          message.candidate = e.candidate.candidate;
          message.sdpMid = e.candidate.sdpMid;
          message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        socket.emit("message", message);
      };

      peer.ontrack = (e) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = e.streams[0];
        }
      };

      if (localStream) {
        localStream.getTracks().forEach((track) =>
          peer.addTrack(track, localStream)
        );
      }

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("message", { type: "offer", sdp: offer.sdp });
    } catch (error) {
      console.error(error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (pc) {
      console.error("existing peerconnection");
      return;
    }
    try {
      const peer = new RTCPeerConnection(servers);
      setPc(peer);

      peer.onicecandidate = (e) => {
        const message: any = { type: "candidate", candidate: null };
        if (e.candidate) {
          message.candidate = e.candidate.candidate;
          message.sdpMid = e.candidate.sdpMid;
          message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        socket.emit("message", message);
      };

      peer.ontrack = (e) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = e.streams[0];
        }
      };

      if (localStream) {
        localStream.getTracks().forEach((track) =>
          peer.addTrack(track, localStream)
        );
      }

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("message", { type: "answer", sdp: answer.sdp });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Error adding candidate", err);
    }
  };

  const hangup = () => {
    if (pc) {
      pc.close();
      setPc(null);
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (startButton.current) startButton.current.disabled = false;
    if (hangupButton.current) hangupButton.current.disabled = true;
    if (muteAudButton.current) muteAudButton.current.disabled = true;
  };

  const startB = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true },
      });
      setLocalStream(stream);

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
    }

    if (startButton.current) startButton.current.disabled = true;
    if (hangupButton.current) hangupButton.current.disabled = false;
    if (muteAudButton.current) muteAudButton.current.disabled = false;

    socket.emit("message", { type: "ready" });
  };

  const hangB = async () => {
    hangup();
    socket.emit("message", { type: "bye" });
  };

  const muteAudio = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks[0].enabled = audioState;
      setAudioState(!audioState);
    }
  };

  return (
    <main className="container">
      <div className="video bg-main">
        <video
          ref={localVideo}
          className="video-item"
          autoPlay
          playsInline
          muted
        />
        <video ref={remoteVideo} className="video-item" autoPlay playsInline />
      </div>

      <div className="btn">
        <button
          className="btn-item btn-start"
          ref={startButton}
          onClick={startB}
        >
          Video
        </button>
        <button
          className="btn-item btn-end"
          ref={hangupButton}
          onClick={hangB}
        >
          Video off
        </button>
        <button
          className="btn-item btn-start"
          ref={muteAudButton}
          onClick={muteAudio}
        >
          {audioState ? 'unmuted' : 'muted'}
        </button>
      </div>
    </main>
  );
};

export default VideoCall;
