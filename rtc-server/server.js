const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
    res.send("WebRTC Signalling Server running");
});

io.on("connection", (socket) => {
    res.send("New client connected:", socket.id);

    // Join a room:
    socket.on("join", (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room ${roomId}`);
        socket.to(roomId).emit("user-joined", socket.id);
    });

    // Send offer:
    socket.on("offer", (payload) => {
        io.to(payload.target).emit("offer", {
            sdp: payload.sdp,
            caller: payload.caller,
        });
    });

    // Send answer:
    socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", {
            sdp: payload.sdp,
            answerer: payload.answerer,
        });
    });

    // Share ICE candidates:
    socket.on("ice-candidate", (payload) => {
        io.to(payload.target).emit("ice-candidate", {
            candidate: payload.candidate,
            from: payload.from,
        });
    });

    // End call:
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(3000, (req, res) => {
    console.log("Server running on http://localhost:3000");
});