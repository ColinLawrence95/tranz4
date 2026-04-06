import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Metadata tracked for each uploaded file.
 */
export type StoredFile = {
    path: string;
    originalname: string;
};

/**
 * In-memory map: file ID to stored file metadata.
 */
export type FileStore = Record<string, StoredFile>;

/**
 * Directory where uploaded files are persisted.
 */
export const UPLOAD_DIR = "uploads";

/**
 * Shared in-memory file index used by upload and download routes.
 */
export const files: FileStore = {};

/**
 * Ensures the upload directory exists before handling uploads.
 */
function ensureUploadDirectory(): void {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR);
    }
}

/**
 * Generates the stored filename using a UUID while preserving the original extension.
 */
function generateStoredFilename(file: Express.Multer.File): string {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    return id + ext;
}

/**
 * Creates the Multer disk storage engine used by the shared uploader.
 */
function createStorage(): multer.StorageEngine {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
            cb(null, generateStoredFilename(file));
        },
    });
}

/**
 * Initializes upload prerequisites at module load time.
 */
ensureUploadDirectory();
const storage = createStorage();

/**
 * Shared Multer uploader middleware configured with disk storage.
 */
export const upload = multer({ storage });
