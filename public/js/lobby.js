const usernameDisplay = document.getElementById("usernameDisplay");
const usersStatus = document.getElementById("usersStatus");
const usersList = document.getElementById("usersList");
const messageLog = document.getElementById("messageLog");
const logout = document.getElementById("logOut");

function setMessage(msg) {
    messageLog.textContent = msg;
}

// Check if user is logged in
async function checkAuth() {
    try {
        const res = await fetch('/api/me');
        if (res.status === 401) {
            // Not logged in, redirect to login
            window.location.href = '/';
            return false;
        }

        const data = await res.json();
        usernameDisplay.textContent = `Logged in as: ${data.username}`;

        loadLobbyUsers();
    } catch (error) {
        console.error('Error checking login status:', error);
        setMessage('Error verifying session');
    }
}

// Load players in the lobby
async function loadLobbyUsers() {
    try {
        usersStatus.textContent = 'Loading users...';
        const res = await fetch('/api/lobby/users');

        if (!res.ok) {
            usersStatus.textContent = 'Error loading users';
            return;
        }

        const users = await res.json();

        if (users.length === 0) {
            usersStatus.textContent = 'No other players online';
            usersList.innerHTML = '';
            return;
        }

        usersStatus.textContent = "";
        usersList.innerHTML = '';

        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.username + " ";
            
            const challengeBtn = document.createElement('button');
            challengeBtn.textContent = 'Challenge';
            challengeBtn.addEventListener('click', () => sendChallenge(user.id, user.username));

            li.appendChild(challengeBtn);
            usersList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading lobby users:', error);
        usersStatus.textContent = 'Error loading users';
    }
}

// Send a challenge to another player
async function sendChallenge(opponentId, opponentName) {
    setMessage(`Challenging ${opponentName}...`);

    try {
        const res = await fetch('/api/lobby/challenge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opponentId })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const errorMsg = errorData.error || 'Error sending challenge';
            setMessage(`Challenge failed: ${errorMsg}`);
            return;
        }

        const data = await res.json();
        setMessage(`Challenge sent to ${opponentName}. Game ID: ${data.gameId}, status: ${data.status}`);
    } catch (error) {
        console.error('Error sending challenge:', error);
        setMessage('Error sending challenge');
    }

}

// Logout function

logout.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const res = await fetch('/api/logout', {
            method: 'POST'
        });

        if (res.status === 204) {
            window.location.href = '/';
        } else {
            setMessage('Error logging out');
        }
    } catch (error) {
        console.error('Error logging out:', error);
        setMessage('Error logging out');
    }
});
checkAuth();