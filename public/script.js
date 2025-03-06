const socket = io();
let username = '';
let peer;
let myStream;
let myPeerId;
let currentCall;

// Initialize PeerJS
function initializePeer() {
    peer = new Peer(undefined, {
        host: '/',
        path: '/peerjs'
    });

    peer.on('open', (id) => {
        myPeerId = id;
        console.log('My peer ID:', id);
        document.getElementById('mainContainer').innerHTML += `<div>Your Peer ID: ${id}</div>`;
    });

    peer.on('call', (call) => {
        if (confirm('Incoming call. Accept?')) {
            call.answer(myStream);
            handleCall(call);
        } else {
            call.close();
        }
    });
}

async function startVideo() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        document.getElementById('localVideo').srcObject = myStream;
        document.getElementById('callButton').disabled = false;
        document.getElementById('startVideo').disabled = true;
    } catch (err) {
        console.error('Failed to get media devices:', err);
        alert('Failed to access camera and microphone');
    }
}

function handleCall(call) {
    currentCall = call;
    call.on('stream', (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
    });
    call.on('close', () => {
        document.getElementById('remoteVideo').srcObject = null;
        document.getElementById('callButton').style.display = 'block';
        document.getElementById('endCall').style.display = 'none';
    });
    document.getElementById('callButton').style.display = 'none';
    document.getElementById('endCall').style.display = 'block';
}

function startCall() {
    const remotePeerId = prompt('Enter the peer ID to call:');
    if (remotePeerId && myStream) {
        const call = peer.call(remotePeerId, myStream);
        handleCall(call);
    }
}

function endCall() {
    if (currentCall) {
        currentCall.close();
        currentCall = null;
    }
    document.getElementById('callButton').style.display = 'block';
    document.getElementById('endCall').style.display = 'none';
}

function setUsername() {
    const usernameInput = document.getElementById('usernameInput');
    username = usernameInput.value.trim();
    
    if (username !== '') {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'flex';
        socket.emit('setUsername', username);
        addSystemMessage('You joined the chat');
        initializePeer();
    }
}

function addMessage(data, isSent = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    messageDiv.innerHTML = `
        <div class="username">${data.username}</div>
        ${data.message}
        <div class="timestamp">${data.time}</div>
    `;
    
    document.getElementById('chatMessages').appendChild(messageDiv);
    scrollToBottom();
}

function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    document.getElementById('chatMessages').appendChild(messageDiv);
    scrollToBottom();
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message !== '') {
        const time = new Date().toLocaleTimeString();
        socket.emit('chatMessage', message);
        addMessage({ username: 'You', message, time }, true);
        messageInput.value = '';
    }
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Socket event listeners
socket.on('message', (data) => {
    if (data.username !== username) {
        addMessage(data);
    }
});

socket.on('userJoined', (user) => {
    addSystemMessage(`${user} joined the chat`);
});

socket.on('userLeft', (user) => {
    addSystemMessage(`${user} left the chat`);
});

// Listen for Enter key
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('usernameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        setUsername();
    }
}); 
