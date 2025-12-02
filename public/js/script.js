const statusElement = document.getElementById('status');

//test API
fetch('/api/health')
    .then(response => response.json())
    .then(data => {
        statusElement.textContent = `Server Status: ${data.status} (Time: ${data.time})`;
    })
    .catch(error => {
        statusElement.textContent = 'Error connecting to server';
        console.error('Error fetching server health:', error);
    });

    // Test Socket.IO
const socket = io();

socket.on('connect', () => {
    console.log('Connected to server via Socket.IO:', socket.id);
});