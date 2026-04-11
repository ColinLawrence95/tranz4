import { useState } from "react";

/**
 * Props accepted by the login page component.
 */
type LoginProps = {
    /**
     * Called when authentication succeeds with a one-time upload token.
     */
    onAuthenticated: (token: string) => void;
};

/**
 * Login page for requesting a one-time upload token.
 *
 * Submits username and password to `/auth/token` and forwards the returned
 * token to the parent via `onAuthenticated`.
 */
function Login({ onAuthenticated }: LoginProps) {
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");

    /**
     * Handles login form submission and token request.
     *
     * @param event - Form submit event from the login form.
     */
    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setStatus("Requesting Upload Token...");

        const formdata = new FormData(event.currentTarget);
        const response = await fetch("/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: (formdata.get("username") as string)?.trim(),
                password: (formdata.get("password") as string)?.trim(),
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            setError(data.error ?? "Login failed");
            setStatus("");
            return;
        }
        onAuthenticated(data.token);
        setStatus("Token requested successfully.");
    }

    const message = error || status;
    const messageClass = error ? "text-red-500" : "text-gray-400";

    return (
        <div className="flex h-100 w-100 flex-col items-center justify-center gap-4 bg-gray-900">
            <h1 className="text-2xl">TRANZ4</h1>
            <form onSubmit={handleLogin} className="flex w-65 flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h4 className="text-xs text-gray-400">USERNAME</h4>
                    <input
                        name="username"
                        type="text"
                        required
                        autoComplete="username"
                        className="block w-full border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <h4 className="text-xs text-gray-400">PASSWORD</h4>
                    <input
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        className="block w-full border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-gray-950 px-4 py-2 text-white transition-colors duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                    Generate Token
                </button>
                <p className={`min-h-5 text-sm ${messageClass}`}>{message || " "}</p>
            </form>
        </div>
    );
}
export default Login;
