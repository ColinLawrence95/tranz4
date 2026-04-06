import express from "express";
import path from "path";
export default function createUploadsRouter({ upload, files, port }) {
    const router = express.Router();
    router.post("/", upload.single("file"), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const fileId = path.parse(req.file.filename).name;
        files[fileId] = { path: req.file.path, originalname: req.file.originalname };
        res.json({ link: `http://localhost:${port}/downloads/${fileId}` });
    });
    return router;
}
