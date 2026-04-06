import express from "express";
import cors from "cors";
import createDownloadRouter from "./routes/downloads.ts";
import createUploadRouter from "./routes/uploads.ts";
import { files, upload } from "./lib/upload-state.ts";
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());


//Download
app.use("/download", createDownloadRouter(files));

//Upload
app.use("/upload", createUploadRouter({ upload, files, port: PORT }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
