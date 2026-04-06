import express from "express";
import jwt from "jsonwebtoken";
import type { FileStore } from "../lib/upload-state.ts";

/**
 * Creates an Express router for handling file downloads.
 * Verifies a per-file signed download token before serving.
 * @param files in-memory store for uploaded files
 * @returns Express router for handling file downloads
 */
export default function createDownloadRouter(files: FileStore) {
    const router = express.Router();

    router.get("/:id", (req, res) => {
        const token = typeof req.query.token === "string" ? req.query.token : undefined;
        if (!token) {
            return res.status(401).json({ error: "Missing download token" });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET not set" });
        }

        try {
            const payload = jwt.verify(token, secret) as { sub?: string; purpose?: string };
            if (payload.purpose !== "download" || payload.sub !== req.params.id) {
                return res.status(403).json({ error: "Token not valid for this file" });
            }
        } catch {
            return res.status(401).json({ error: "Invalid or expired download token" });
        }

        const file = files[req.params.id];
        if (!file) {
            return res.status(404).send("File not found");
        }

        return res.download(file.path, file.originalname);
    });

    return router;
}
