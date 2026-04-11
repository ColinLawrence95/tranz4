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
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";
export const FILE_RETENTION_TTL = process.env.FILE_RETENTION_TTL ?? "1h";

/**
 * Shared in-memory file index used by upload and download routes.
 */
export const files: FileStore = {};

/**
 * Ensures the upload directory exists before handling uploads.
 */
function ensureUploadDirectory(): void {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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
 * Falls back to 1h if the format isn't recognised.
 */
function ttlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 60 * 60 * 1000;
    const n = parseInt(match[1], 10);
    const units: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return n * units[match[2]];
}

/**
 * Deletes a file from disk and from the in-memory file store.
 */
function deleteStoredFile(fileId: string): void {
    const file = files[fileId];
    if (!file) return;

    fs.unlink(file.path, (err) => {
        if (err && err.code !== "ENOENT") {
            console.error(`Failed to delete file ${fileId}:`, err);
        }
    });

    delete files[fileId];
}

/**
 * Best-effort cleanup that removes stale upload files from disk.
 * This also covers files left behind across server restarts.
 */
function cleanupExpiredFilesOnDisk(): void {
    const retentionMs = ttlToMs(FILE_RETENTION_TTL);
    const now = Date.now();

    const storedPaths = new Set(Object.values(files).map((file) => file.path));

    let entries: string[];
    try {
        entries = fs.readdirSync(UPLOAD_DIR);
    } catch (err) {
        console.error("Failed to read upload directory for cleanup:", err);
        return;
    }

    for (const entry of entries) {
        const fullPath = path.join(UPLOAD_DIR, entry);
        let stats: fs.Stats;
        try {
            stats = fs.statSync(fullPath);
        } catch {
            continue;
        }

        if (!stats.isFile()) continue;
        if (storedPaths.has(fullPath)) continue;

        if (now - stats.mtimeMs >= retentionMs) {
            fs.unlink(fullPath, (err) => {
                if (err && err.code !== "ENOENT") {
                    console.error(`Failed to delete stale file ${fullPath}:`, err);
                }
            });
        }
    }
}

/**
 * Starts periodic cleanup for stale uploads that are not tracked in memory
 * (for example, files left after a process restart).
 */
function startUploadCleanupLoop(): void {
    cleanupExpiredFilesOnDisk();

    const intervalMs = 10 * 60 * 1000;
    const timer = setInterval(cleanupExpiredFilesOnDisk, intervalMs);
    timer.unref?.();
}

/**
 * Schedules a file to be deleted from disk and removed from the in-memory store
 * once its retention TTL has elapsed.
 */
export function scheduleFileDeletion(fileId: string, ttl: string = FILE_RETENTION_TTL): void {
    const delayMs = ttlToMs(ttl);
    const timer = setTimeout(() => {
        deleteStoredFile(fileId);
    }, delayMs);

    timer.unref?.();
}

startUploadCleanupLoop();
