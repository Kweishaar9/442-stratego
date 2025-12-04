const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const router = express.Router();

// GET /me
router.get("/me", (req, res) => {
    if (!req.session.userId){
        return res.status(401).json({ error: "Not logged in"});
    }

    res.json({
        authenticated: true,
        userId: req.session.userId,
        username: req.session.username 
    });
});

// GET /api/register/token

router.get("/register/token", (req, res) => {
        if (req.session.userId) {
            return res.status(401).json({ error: "Already logged in" });
        }
        
        const token = Math.random().toString(36).slice(2);
        req.session.registerToken = token;
        req.session.regTokenExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

        res.json({
            token,
            expires: req.session.regTokenExpires
        })
});

// POST /api/register

router.post("/register", async (req, res) => {
    const { username, password, token } = req.body;

    if (!username || !password || !token) {
        return res.status(400).json({ error: "Invalid input" });
    }

    if (
        token !== req.session.registerToken ||
        Date.now() > req.session.regTokenExpires
    ) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            [username, passwordHash]
        );

        return res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Username already taken" });
        }
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }

});

// post /api/login

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Invalid input" });
    }

    const [rows] = await pool.query(
        "SELECT id, username,password_hash FROM users WHERE username = ?",
        [username]
    );

    if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({message: "Logged in successfully!", userId: user.id, username: user.username});
});

// POST /api/logout

router.post("/logout", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }
    req.session.destroy(() => res.status(204).end());
});

module.exports = router;
