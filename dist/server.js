import express from "express";
import cors from "cors";
import createDownloadsRouter from "./routes/downloads.js";
import createUploadsRouter from "./routes/uploads.js";
import { files, upload } from "./lib/upload-state.js";
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
app.use("/downloads", createDownloadsRouter(files));
app.use("/uploads", createUploadsRouter({ upload, files, port: PORT }));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
