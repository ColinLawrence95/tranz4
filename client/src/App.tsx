import { useState } from "react";

/**
 * The three stages the app moves through:
 * - `login`  — not logged in yet, show the credentials form
 * - `ready`  — got a one-time token, ready to pick a file and upload
 * - `done`   — upload worked, we have a download link to show
 */
type AppState =
    | { phase: "login" }
    | { phase: "ready"; token: string }
    | { phase: "done"; link: string };

/**
 *
 * Flow:
 * 1. Log in → server gives back a single-use upload token
 * 2. Pick a file and upload → token gets burned on the server
 * 3. Server hands back a signed download link for that file
 *
 * If the upload goes sideways the token is already gone, so we drop the user
 * back to login so they can grab a fresh one.
 */
function App() {
    const [state, setState] = useState<AppState>({ phase: "login" });
    /** Friendly status text shown below the form, e.g. "Uploading…" */
    const [status, setStatus] = useState("");
    /** Something went wrong — shown in red below the form */
    const [error, setError] = useState("");
    /** Upload percentage (0-100) while a file is being sent */
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    /**
     * Login form handler — sends credentials to `/auth/token` and, if they check out,
     * moves to the `ready` phase with the one-time token we get back.
     *
     * @param e - the form submit event
     */
    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setStatus("Requesting token\u2026");
        const form = new FormData(e.currentTarget);
        const res = await fetch("/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: (form.get("username") as string)?.trim(),
                password: (form.get("password") as string)?.trim(),
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error ?? "Login failed");
            setStatus("");
            return;
        }
        setState({ phase: "ready", token: data.token });
        setStatus("");
    }

    /**
     * Upload form handler — ships the file off to `/upload/` using the one-time token.
     * If it works we get a download link back and move to `done`.
     * If it fails for any reason (bad token, network blip, etc.) we go back to login
     * since the token is already spent.
     *
     * @param e - the form submit event
     */
    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (state.phase !== "ready") return;
        setError("");
        setStatus("Uploading\u2026");
        const form = new FormData(e.currentTarget);
        setUploadProgress(0);

        try {
            const data = await new Promise<{ link?: string; error?: string }>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/upload/");
                xhr.setRequestHeader("Authorization", `Bearer ${state.token}`);
                // Allow long uploads on slower mobile connections.
                xhr.timeout = 30 * 60 * 1000;

                xhr.upload.onprogress = (event) => {
                    if (!event.lengthComputable) return;
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                };

                xhr.onerror = () => reject(new Error("Network error"));
                xhr.ontimeout = () =>
                    reject(
                        new Error("Upload timed out. Please try again on a stronger connection."),
                    );
                xhr.onabort = () => reject(new Error("Upload was cancelled before completion."));
                xhr.onload = () => {
                    let payload: { link?: string; error?: string } = {};
                    try {
                        payload = JSON.parse(xhr.responseText) as { link?: string; error?: string };
                    } catch {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            reject(new Error("Unexpected server response"));
                            return;
                        }
                    }

                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(
                            new Error(
                                payload.error ??
                                    `Upload failed (HTTP ${xhr.status}${xhr.statusText ? ` ${xhr.statusText}` : ""})`,
                            ),
                        );
                        return;
                    }

                    resolve(payload);
                };

                xhr.send(form);
            });

            if (!data.link) {
                throw new Error("Upload succeeded but no link was returned");
            }

            setState({ phase: "done", link: data.link });
            setStatus("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            setStatus("");
            // Token is burned whether the upload worked or not, so back to login
            setState({ phase: "login" });
        } finally {
            setUploadProgress(null);
        }
    }

    // Reusable Tailwind strings — saves typing the same thing on every input/button
    const inputCls =
        "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelCls = "flex flex-col gap-1 text-xs font-medium text-neutral-400";
    const btnCls =
        "mt-1 w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer";

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
                <h1 className="mb-6 text-2xl font-bold text-white tracking-tight">tranz4</h1>

                {state.phase === "login" && (
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <label className={labelCls}>
                            Username
                            <input
                                className={inputCls}
                                name="username"
                                type="text"
                                required
                                autoComplete="username"
                            />
                        </label>
                        <label className={labelCls}>
                            Password
                            <input
                                className={inputCls}
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                            />
                        </label>
                        <button type="submit" className={btnCls}>
                            Get upload token
                        </button>
                    </form>
                )}

                {state.phase === "ready" && (
                    <form onSubmit={handleUpload} className="flex flex-col gap-4">
                        <label className={labelCls}>
                            File
                            <input
                                className="w-full text-sm text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-neutral-700 file:px-3 file:py-1.5 file:text-xs file:text-white file:cursor-pointer"
                                name="file"
                                type="file"
                                required
                            />
                        </label>
                        <button type="submit" className={btnCls}>
                            Upload
                        </button>
                    </form>
                )}

                {state.phase === "done" && (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm text-neutral-300">
                            Upload complete. Share this link:
                        </p>
                        {/* Selectable text box so the link can be copied and sent */}
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={(state as { phase: "done"; link: string }).link}
                                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
                                onFocus={(e) => e.currentTarget.select()}
                            />
                            <button
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        (state as { phase: "done"; link: string }).link,
                                    )
                                }
                                className="shrink-0 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Copy
                            </button>
                        </div>
                        <a
                            href={(state as { phase: "done"; link: string }).link}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-blue-600 px-3 py-2 text-center text-sm text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                            Open
                        </a>
                        <button
                            onClick={() => setState({ phase: "login" })}
                            className="mt-1 w-full rounded-md border border-neutral-700 py-2 text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                            Upload another
                        </button>
                    </div>
                )}

                {status && <p className="mt-3 text-xs text-neutral-500">{status}</p>}
                {uploadProgress !== null && (
                    <div className="mt-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                            <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-neutral-400">{uploadProgress}%</p>
                    </div>
                )}
                {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            </div>
        </div>
    );
}

export default App;
