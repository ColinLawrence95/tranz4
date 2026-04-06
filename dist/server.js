import "dotenv/config";
import express from "express";
import cors from "cors";
import CreateDownloadRouter from "./routes/downloads.js";
import CreateUploadRouter from "./routes/uploads.js";
import CreateAuthRouter from "./routes/auth.js";
import { files, upload } from "./lib/upload-state.js";
import { requireUploadToken } from "./lib/jwt-auth.js";
const app = express();
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const BASE_URL = process.env.BASE_URL ?? `http://tranz4.org:${PORT}`;
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
//Download — auth handled inside router via per-file signed token
app.use("/download", CreateDownloadRouter(files));
//Upload — requires one-time token issued by POST /auth/token
app.use("/upload", requireUploadToken, CreateUploadRouter({ upload, files, baseUrl: BASE_URL }));
//Auth
app.use("/auth", CreateAuthRouter());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
