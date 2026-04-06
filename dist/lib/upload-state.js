import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
export const UPLOAD_DIR = "uploads";
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const id = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, id + ext);
    },
});
export const upload = multer({ storage });
export const files = {};
