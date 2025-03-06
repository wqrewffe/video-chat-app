const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static('public'));

// Set up PeerJS server with explicit options
const peerServer = ExpressPeerServer(server, {
    debug: true,
    allow_discovery: true,
    proxied: true
});

app.use('/peerjs', peerServer);

// Store connected users
let users = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle username selection
    socket.on('setUsername', (username) => {
        users[socket.id] = username;
        socket.broadcast.emit('userJoined', username);
    });

    // Handle chat messages
    socket.on('chatMessage', (message) => {
        io.emit('message', {
            username: users[socket.id],
            message: message,
            time: new Date().toLocaleTimeString()
        });
    });

    // Handle video call signals
    socket.on('callUser', (data) => {
        io.to(data.userToCall).emit('incomingCall', {
            signal: data.signalData,
            from: data.from,
            username: users[socket.id]
        });
    });

    socket.on('acceptCall', (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            io.emit('userLeft', users[socket.id]);
            delete users[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
