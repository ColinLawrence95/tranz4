import { randomUUID } from "crypto";

const validTokens = new Set<string>();

/** Issues a one-time upload token. Valid for a single upload request. */
export function issueUploadToken(): string {
    const token = randomUUID();
    validTokens.add(token);
    return token;
}

/**
 * Consumes a one time upload token.
 * Returns true and removes the token if valid; false if invalid or already used.
 */
export function consumeUploadToken(token: string): boolean {
    if (validTokens.has(token)) {
        validTokens.delete(token);
        return true;
    }
    return false;
}
