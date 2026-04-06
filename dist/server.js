import express from "express";
import cors from "cors";
import createDownloadRouter from "./routes/downloads.js";
import createUploadRouter from "./routes/uploads.js";
import { files, upload } from "./lib/upload-state.js";
const app = express();
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
app.use(cors());
app.use(express.json());
//Download
app.use("/download", createDownloadRouter(files));
//Upload
app.use("/upload", createUploadRouter({ upload, files, baseUrl: BASE_URL }));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
