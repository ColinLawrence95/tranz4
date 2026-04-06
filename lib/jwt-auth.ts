import type { Request, Response, NextFunction } from "express";
import { consumeUploadToken } from "./token-store.ts";

/**
 * Middleware to require a valid one time upload token.
 * Consumes the token on success it cannot be reused.
 */
export function requireUploadToken(req: Request, res: Response, next: NextFunction) {
    const auth = req.header("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

    if (!token) {
        res.status(401).json({ error: "Missing token" });
        return;
    }

    if (!consumeUploadToken(token)) {
        res.status(401).json({ error: "Invalid or already-used token" });
        return;
    }

    next();
}
