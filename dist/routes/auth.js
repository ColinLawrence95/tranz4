import express from "express";
import { issueUploadToken } from "../lib/token-store.js";
/**
 * Creates an Express router for handling one-time upload token issuance.
 * Validates credentials and returns a single-use token for one upload request.
 * @returns Express router for handling token generation
 */
export default function createAuthRouter() {
    const router = express.Router();
    router.post("/token", (req, res) => {
        const { username, password } = (req.body ?? {});
        const authUsername = process.env.AUTH_USERNAME;
        const authPassword = process.env.AUTH_PASSWORD;
        if (!authUsername || !authPassword) {
            return res.status(500).json({ error: "Auth credentials are not configured" });
        }
        if (!username || !password) {
            return res.status(400).json({ error: "username and password are required" });
        }
        if (username !== authUsername || password !== authPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = issueUploadToken();
        res.json({ token });
    });
    return router;
}
