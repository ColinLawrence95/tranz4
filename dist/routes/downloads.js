import express from "express";
const router = express.Router();
/**
 * Creates an Express router for handling file downloads.
 * @param files in-memory store for uploaded files
 * @returns Express router for handling file downloads
 */
export default function createDownloadRouter(files) {
    router.get("/:id", (req, res) => {
        // Look up the file metadata using the file ID from the URL parameter
        const file = files[req.params.id];
        if (!file) {
            return res.status(404).send("File not found");
        }
        // Send the file as a download response with the original filename
        return res.download(file.path, file.originalname);
    });
    return router;
}
