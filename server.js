const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { ExpressPeerServer } = require('peer');

app.use(express.static('public'));

// Create peer server
const peerServer = ExpressPeerServer(http, {
    debug: true
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
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 