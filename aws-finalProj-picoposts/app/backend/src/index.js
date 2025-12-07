import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

const {
    DB_HOST_WRITE,
    DB_USER,
    DB_NAME,
    DB_PASSWORD,
} = process.env;

if (!DB_HOST_WRITE || !DB_USER || !DB_NAME || !DB_PASSWORD) {
    console.error("Missing one of DB_HOST_WRITE / DB_USER / DB_NAME / DB_PASSWORD");
    process.exit(1);
}

const app = express();
app.use(cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: false
}));

// Required to handle preflight correctly
app.options("*", cors());

app.use(express.json());
app.use(bodyParser.json());

let pool;

// Initialize DB pool once
async function initDb() {
    pool = mysql.createPool({
        host: DB_HOST_WRITE,
        user: DB_USER,
        database: DB_NAME,
        password: DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    console.log("MySQL pool initialized");
}

// Health check
app.get("/healthz", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS ok");
        if (rows[0]?.ok === 1) {
            return res.json({ status: "ok" });
        }
        return res.status(500).json({ status: "db_error" });
    } catch (err) {
        console.error("Healthz DB error:", err);
        return res.status(500).json({ status: "db_error" });
    }
});

// Create user
app.post("/api/users", async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "email required" });
    }

    const userId = uuidv4();

    try {
        await pool.query(
            "INSERT INTO users (id, email, created_at) VALUES (?, ?, NOW())",
            [userId, email]
        );
        res.json({ userId });
    } catch (err) {
        console.error("Create user error:", err);
        res.status(500).json({ error: "internal_error" });
    }
});

// Create post
app.post("/api/posts", async (req, res) => {
    const { userId, content } = req.body;
    if (!userId || !content) {
        return res.status(400).json({ error: "userId and content required" });
    }

    const postId = uuidv4();

    try {
        await pool.query(
            "INSERT INTO posts (id, user_id, content, created_at) VALUES (?, ?, ?, NOW())",
            [postId, userId, content]
        );
        res.json({ postId });
    } catch (err) {
        console.error("Create post error:", err);
        res.status(500).json({ error: "internal_error" });
    }
});


// Feed
app.get("/api/feed", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: "userId required" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT id, content, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            [userId]
        );
        res.json({ posts: rows });
    } catch (err) {
        console.error("Feed error:", err);
        res.status(500).json({ error: "internal_error" });
    }
});

const port = process.env.PORT || 3000;

async function start() {
    try {
        await initDb();
        app.listen(port, () => {
            console.log(`PicoPosts API listening on port ${port}`);
        });
    } catch (err) {
        console.error("Fatal init error:", err);
        process.exit(1);
    }
}

start();
