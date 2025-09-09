const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
    origin: "http://localhost:5173"
  }
});

app.get("/", (req, res) => {
    res.send("WebRTC Signalling Server running");
});

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("message", (message) => {
        socket.broadcast.emit("message", message);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });

    // Join a room:
    // socket.on("join", (roomId) => {
    //     socket.join(roomId);
    //     console.log(`${socket.id} joined room ${roomId}`);
    //     socket.to(roomId).emit("user-joined", socket.id);
    // });

    // // Send offer:
    // socket.on("offer", ({ roomId, offer }) => {
    //     socket.to(roomId).emit("offer", { offer });
    // });

    // // Send answer:
    // socket.on("answer", ({ roomId, answer }) => {
    //     socket.to(roomId).emit("answer", { answer });
    // });

    // // Share ICE candidates:
    // socket.on("ice-candidate", ({ roomId, candidate }) => {
    //     socket.to(roomId).emit("ice-candidate", { candidate });
    // });

    // // End call:
    // socket.on("disconnect", () => {
    //     console.log("Client disconnected:", socket.id);
    // });
});


function error(err, req, res, next) {
  // log it
  if (!test) console.error(err.stack);

  // respond with 500 "Internal Server Error".
  res.status(500);
  res.send("Internal Server Error");
}
app.use(error);

server.listen(3000, (req, res) => {
    console.log("Server running on http://localhost:3000");
});