const express = require("express");
const pool = require("../db");
const e = require("express");
const router = express.Router();

// Authentication guard for lobby routes

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

// GET /api/lobby/users
// Lists users available to challenge in the lobby
router.get("/users", requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, username FROM users WHERE id != ?",
            [req.session.userId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Helper function to check is a user is alreading in a pending or active game
async function userInActiveOrPendingGame(userId) {
    const [rows] = await pool.query(
        `SELECT id FROM games 
         WHERE (player1_id = ? OR player2_id = ?) 
         AND status IN ('pending', 'active')`,
        [userId, userId]
    );
    return rows.length > 0;
}

// POST /api/lobby/challenge
// Challenge another user to a game body: { opponentId }
router.post("/challenge", requireAuth, async (req, res) => {

    const { opponentId } = req.body;
    if (!opponentId || Number.isNaN(opponentId)) {
        return res.status(400).json({ error: "Invalid opponent ID" });
    }

    const challengerId = req.session.userId;

    if (challengerId === opponentId) {
        return res.status(400).json({ error: "Cannot challenge yourself" });
    }

    try {
        // Checks if the opponent exists
        const [opponentRows] = await pool.query(
            "SELECT id FROM users WHERE id = ?",
            [opponentId]
        );
        if (opponentRows.length === 0) {
            return res.status(404).json({ error: "Opponent not found" });
        }

        // Check if either user is already in a pending or active game
        if (await userInActiveOrPendingGame(challengerId) || await userInActiveOrPendingGame(opponentId)) {
            return res.status(400).json({ error: "One of the users is already in a game" });
        }

       const [result] = await pool.query(
              `INSERT INTO games (player1_id, player2_id, status) VALUES (?, ?, 'pending')`,
              [challengerId, opponentId]
        );

        const gameId = result.insertId;

        res.json({ gameId, status: "pending" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// POST /api/lobby/respond
// Responds to a game challenge { gameId, accept: true/false }
router.post("/respond", requireAuth, async (req, res) => {
    const { gameId, accept } = req.body;
    const userId = req.session.userId;

    if (!gameId || typeof accept !== "boolean") {
        return res.status(400).json({ error: "Invalid request body" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT * FROM games WHERE id =?",
            [gameId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Game not found" });
        }

        const game = rows[0];

        // Only the challenged player can respond (player2)
        if (game.player2_id !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (game.status !== "pending") {
            return res.status(400).json({ error: "Game is not pending" });
        }

        let newStatus = accept ? "active" : "declined";

        await pool.query(
            "UPDATE games SET status = ? WHERE id = ?",
            [newStatus, gameId]
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;