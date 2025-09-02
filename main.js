import { appId } from "./consts";

/////
let APP_ID = appId;
let token = null;
let uid = String(Math.floor(Math.random() * 10000));

let client;
let channel;
/////

let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let init = async () => {
    /////
    client = new AgoraRTM.RTM(APP_ID, uid);
    await client.login({ token });
    client.addEventListener("message", event => {
  const { publisher, message } = event;
  console.log("Message received from", publisher, ":", message);
    });
    /////

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    document.getElementById('user-1').srcObject = localStream;

    createOffer();
}

let createOffer = async () => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('user-2').srcObject = remoteStream;

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.stream[0].getTracks().forEach((track) => {
            remoteStream.addTrack();
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            console.log('New ICE Candidate: ', event.candidate);
        }
    }

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    //////
    await client.publish("yourTopic", JSON.stringify({ type: "offer", sdp: offer }));
    //////

    console.log('Offer: ', offer);
}

init();