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
                username: form.get("username"),
                password: form.get("password"),
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
        const res = await fetch("/upload/", {
            method: "POST",
            headers: { Authorization: `Bearer ${state.token}` },
            body: form,
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error ?? "Upload failed");
            setStatus("");
            // Token is burned whether the upload worked or not, so back to login
            setState({ phase: "login" });
            return;
        }
        setState({ phase: "done", link: data.link });
        setStatus("");
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
                        <p className="text-sm text-neutral-300">Upload complete.</p>
                        <a
                            href={(state as { phase: "done"; link: string }).link}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-blue-600 px-3 py-2 text-center text-sm text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                            Open download link
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
                {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            </div>
        </div>
    );
}

export default App;
