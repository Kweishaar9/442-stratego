const statusElement = document.getElementById('status');
const loginDiv = document.getElementById('loginDiv');
const loginError = document.getElementById('loginError');
const loginForm = document.getElementById('loginForm');

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


fetch('/api/me')
    .then(async (res) => {
        if (res.status === 401) {
            // If the user is not logged in, show the login form
            loginDiv.style.display = 'block';
            return;
        }
        const data =  await res.json();
        // If the user is already logged in, redirect to the lobby
        window.location.href = '/lobby.html';

    }).catch(error => {
        console.error('Error checking authentication status:', error);
    });

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });

    if (!res.ok){
        loginError.textContent = "Invalid username or password.";
        return;
    }

    // On successful login, redirect to the lobby
    window.location.href = '/lobby.html';

});


const socket = io();
socket.on('connect', () => {
    console.log('Connected to server via Socket.IO:', socket.id);
});