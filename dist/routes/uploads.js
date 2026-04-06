import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
/**
 * Creates an Express router for handling file uploads.
 * After a successful upload, returns a per-file signed download link.
 * @param upload multer instance for handling file uploads
 * @param files in-memory store for uploaded files
 * @param baseUrl base URL for constructing download links
 * @returns Express router for handling file uploads
 */
export default function createUploadRouter({ upload, files, baseUrl, }) {
    const router = express.Router();
    router.post("/", upload.single("file"), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET not set" });
        }
        // Extract the file ID from the stored filename (UUID without extension)
        const fileId = path.parse(req.file.filename).name;
        // Store the file metadata in the in-memory file index
        files[fileId] = { path: req.file.path, originalname: req.file.originalname };
        // Sign a per-file download token scoped to this file ID only
        const downloadToken = jwt.sign({ sub: fileId, purpose: "download" }, secret, {
            expiresIn: "24h",
        });
        const link = `${baseUrl}/download/${fileId}?token=${encodeURIComponent(downloadToken)}`;
        res.json({ link });
    });
    return router;
}
