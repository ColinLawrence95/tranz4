import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
/**
 * Directory where uploaded files are persisted.
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";
/**
 * Shared in-memory file index used by upload and download routes.
 */
export const files = {};
/**
 * Ensures the upload directory exists before handling uploads.
 */
function ensureUploadDirectory() {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}
/**
 * Generates the stored filename using a UUID while preserving the original extension.
 */
function generateStoredFilename(file) {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    return id + ext;
}
/**
 * Creates the Multer disk storage engine used by the shared uploader.
 */
function createStorage() {
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
/** Optional upload size cap in MB. Leave unset for unlimited uploads. */
const maxUploadMbRaw = process.env.MAX_UPLOAD_MB;
const maxUploadMb = maxUploadMbRaw ? Number.parseInt(maxUploadMbRaw, 10) : Number.NaN;
const hasUploadCap = Number.isFinite(maxUploadMb) && maxUploadMb > 0;
/**
 * Shared Multer uploader middleware configured with disk storage.
 */
export const upload = hasUploadCap
    ? multer({ storage, limits: { fileSize: maxUploadMb * 1024 * 1024 } })
    : multer({ storage });
/**
 * Converts a TTL string like "24h", "7d", "30m" to milliseconds.
 * Falls back to 24h if the format isn't recognised.
 */
function ttlToMs(ttl) {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match)
        return 24 * 60 * 60 * 1000;
    const n = parseInt(match[1], 10);
    const units = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return n * units[match[2]];
}
/**
 * Schedules a file to be deleted from disk and removed from the in-memory store
 * once its download link TTL has elapsed. This keeps the server clean without
 * needing a separate cron job.
 */
export function scheduleFileDeletion(fileId, ttl) {
    const delayMs = ttlToMs(ttl);
    setTimeout(() => {
        const file = files[fileId];
        if (!file)
            return;
        fs.unlink(file.path, (err) => {
            if (err && err.code !== "ENOENT") {
                console.error(`Failed to delete file ${fileId}:`, err);
            }
        });
        delete files[fileId];
    }, delayMs);
}
