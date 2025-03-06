const socket = io();
let username = '';
let peer;
let myStream;
let myPeerId;
let currentCall;

// Initialize PeerJS
function initializePeer() {
    console.log('Initializing peer with username:', username);
    
    if (peer) {
        peer.destroy();
    }

    peer = new Peer(username, {
        host: '0.peerjs.com',
        secure: true,
        port: 443,
        debug: 3,
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });

    peer.on('open', (id) => {
        myPeerId = id;
        console.log('Successfully connected with ID:', id);
        
        const userDisplay = document.getElementById('userDisplayName');
        userDisplay.innerHTML = `
            <div style="margin-top: 10px; background: #333; padding: 10px; border-radius: 5px;">
                <p style="margin: 0;">Connected as: ${username}</p>
                <p style="word-break: break-all; margin: 5px 0; color: #4CAF50;">ID: ${id}</p>
            </div>
        `;
    });

    peer.on('call', (call) => {
        console.log('Incoming call from:', call.peer); // Debug log
        if (confirm(`Incoming call from ${call.peer}. Accept?`)) {
            console.log('Call accepted, answering with stream:', myStream ? 'exists' : 'missing'); // Debug log
            call.answer(myStream);
            handleCall(call);
        } else {
            console.log('Call rejected'); // Debug log
            call.close();
        }
    });

    peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        alert(`Connection error: ${error.type}`);
    });

    peer.on('disconnected', () => {
        console.log('Disconnected from server, attempting to reconnect...');
        peer.reconnect();
    });
}

// Fallback function with random ID if username is taken
function initializePeerWithRandomId() {
    peer = new Peer(undefined, {
        host: '0.peerjs.com',
        secure: true,
        port: 443,
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });
}

// Function to copy username
function copyUsername() {
    navigator.clipboard.writeText(username)
        .then(() => alert('Username copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
}

// Update startCall to use username
function startCall() {
    const remoteUsername = prompt('Enter the username to call:');
    console.log('Attempting to call:', remoteUsername); // Debug log
    
    if (remoteUsername && myStream) {
        console.log('Making call to:', remoteUsername, 'My stream:', myStream ? 'exists' : 'missing');
        const call = peer.call(remoteUsername, myStream);
        console.log('Call object created:', call); // Debug log
        handleCall(call);
    } else {
        console.log('Call failed - Stream:', myStream ? 'exists' : 'missing', 'Username:', remoteUsername); // Debug log
    }
}

async function startVideo() {
    try {
        console.log('Requesting media access...'); // Debug log
        myStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        console.log('Media access granted:', myStream); // Debug log
        document.getElementById('localVideo').srcObject = myStream;
        document.getElementById('callButton').disabled = false;
        document.getElementById('startVideo').disabled = true;
    } catch (err) {
        console.error('Failed to get media devices:', err);
        alert('Failed to access camera and microphone');
    }
}

function handleCall(call) {
    console.log('Handling call:', call); // Debug log
    currentCall = call;
    
    call.on('stream', (remoteStream) => {
        console.log('Received remote stream:', remoteStream); // Debug log
        document.getElementById('remoteVideo').srcObject = remoteStream;
    });

    call.on('error', (error) => {
        console.error('Call error:', error); // Debug log
    });

    call.on('close', () => {
        console.log('Call closed'); // Debug log
        document.getElementById('remoteVideo').srcObject = null;
        document.getElementById('callButton').style.display = 'block';
        document.getElementById('endCall').style.display = 'none';
    });

    document.getElementById('callButton').style.display = 'none';
    document.getElementById('endCall').style.display = 'block';
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

// Add this new function for copying peer ID
function copyPeerId() {
    if (myPeerId) {
        navigator.clipboard.writeText(myPeerId)
            .then(() => alert('Peer ID copied!'))
            .catch(err => console.error('Failed to copy:', err));
    }
}
