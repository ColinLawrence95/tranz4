import express from "express";
import multer from "multer";
import path from "path";
import type { FileStore } from "../lib/upload-state.ts";
const router = express.Router();

/**
 * Creates an Express router for handling file uploads.
 * @param upload multer instance for handling file uploads
 * @param files in-memory store for uploaded files
 * @param port server port for constructing download links
 * @returns Express router for handling file uploads
 */
export default function createUploadRouter({
    upload,
    files,
    baseUrl,
}: {
    upload: multer.Multer;
    files: FileStore;
    baseUrl: string;
}) {
    router.post("/", upload.single("file"), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Extract the file ID from the stored filename (UUID without extension)
        const fileId = path.parse(req.file.filename).name;
        // Store the file metadata in the in-memory file index
        files[fileId] = { path: req.file.path, originalname: req.file.originalname };
        // Respond with the download link for the uploaded file
        res.json({ link: `${baseUrl}/download/${fileId}` });
    });
    return router;
}
