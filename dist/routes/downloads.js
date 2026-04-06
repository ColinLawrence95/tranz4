import express from "express";
export default function createDownloadsRouter(files) {
    const router = express.Router();
    router.get("/:id", (req, res) => {
        const file = files[req.params.id];
        if (!file) {
            return res.status(404).send("File not found");
        }
        return res.download(file.path, file.originalname);
    });
    return router;
}
