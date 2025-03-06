// Store messages in an array
let messages = [];

// Function to add a new message
function addMessage(text, isSent) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const currentTime = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    messageDiv.innerHTML = `
        ${text}
        <div class="timestamp">${currentTime}</div>
    `;
    
    document.getElementById('chatMessages').appendChild(messageDiv);
    
    // Scroll to the bottom of the chat
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to send a message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message !== '') {
        // Add the sent message
        addMessage(message, true);
        
        // Simulate received message (for demo purposes)
        setTimeout(() => {
            addMessage('This is a demo response!', false);
        }, 1000);
        
        // Clear input
        messageInput.value = '';
    }
}

// Listen for Enter key press
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Add some initial messages for demonstration
window.onload = function() {
    addMessage("Welcome to the chat!", false);
}; 