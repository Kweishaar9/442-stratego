const path = require("path");
const express = require("express");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("io", io);


//middleware
app.use(
    session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000 * 60 * 60 * 2 , // 2 hours
    },
    })
);



// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Auth API routes
const authRoutes = require("./src/routes/auth");
app.use("/api", authRoutes);

const lobbyRoutes = require("./src/routes/lobby");
app.use("/api/lobby", lobbyRoutes);

// Test API route
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", time: new Date().toISOString() });
});


// Root route for main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Socket.io connection
io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});