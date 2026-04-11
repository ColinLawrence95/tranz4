import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * Props accepted by the file uploader.
 */
type FileUploaderProps = {
    /** One-time upload token used for the authenticated upload request. */
    token: string;
};

/**
 * Upload page component that sends a file to `/upload/` and then reveals
 * a copyable download link returned by the API.
 */
function FileUploader({ token }: FileUploaderProps) {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [link, setLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);

    /** Copies the generated download link to the system clipboard. */
    function copyLink() {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    /** Plays an exit transition before routing back to the landing page. */
    function handleUploadAgain() {
        setIsNavigatingAway(true);
        setTimeout(() => navigate("/"), 300);
    }

    /**
     * Handles file form submission and performs the authenticated upload.
     *
     * @param event - Submit event from the upload form.
     */
    function handleUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        setError("");
        setLink("");
        setProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/upload/");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                setProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            setProgress(null);
            let data: { link?: string; error?: string } = {};
            try {
                data = JSON.parse(xhr.responseText);
            } catch {
                /* ignore */
            }
            if (xhr.status < 200 || xhr.status >= 300) {
                setError(data.error ?? `Upload failed (HTTP ${xhr.status})`);
                return;
            }
            if (!data.link) {
                setError("Upload succeeded but no link was returned");
                return;
            }
            setLink(data.link);
        };

        xhr.onerror = () => {
            setProgress(null);
            setError("Network error");
        };
        xhr.ontimeout = () => {
            setProgress(null);
            setError("Upload timed out");
        };

        xhr.send(formData);
    }

    return (
        <div className="flex h-85 w-85 md:h-100 md:w-100 flex-col items-center justify-center gap-4 bg-gray-900">
            <AnimatePresence mode="wait">
                {!link ? (
                    <motion.div
                        key="upload-panel"
                        className="flex flex-col items-center gap-10"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h1 className="text-xl">Upload a File</h1>
                        <form onSubmit={handleUpload} className="flex flex-col gap-10">
                            <input
                                type="file"
                                name="file"
                                required
                                className="w-80 cursor-pointer border border-gray-700 bg-gray-950 text-sm text-gray-300 focus:ring-2 focus:ring-[#c24e01] focus:outline-none file:mr-4 file:cursor-pointer file:border-0 file:bg-[#c24e01] file:px-2 file:py-2 file:font-medium file:text-white hover:file:bg-[#a84301]"
                            />
                            <button
                                type="submit"
                                className="bg-gray-950 px-4 py-2 text-white transition-colors duration-200 hover:bg-[#a84301] focus:ring-2 focus:ring-[#c24e01] focus:outline-none"
                            >
                                Upload
                            </button>
                        </form>
                        <div className="w-76 flex flex-col items-center">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                                <div
                                    className="h-full bg-[#c24e01] transition-all duration-200"
                                    style={{ width: `${progress ?? 0}%` }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{progress ?? 0}%</p>
                        </div>
                        {error && <p className="text-sm text-[#c24e01]">{error}</p>}
                    </motion.div>
                ) : (
                    <motion.div
                        key="link-panel"
                        className="w-75"
                        initial={{ opacity: 0, y: 8 }}
                        animate={isNavigatingAway ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex w-full flex-col items-center gap-5">
                            <h1>Download Link</h1>
                            <div className="flex w-full gap-2">
                                <input
                                    readOnly
                                    value={link}
                                    onFocus={(event) => event.currentTarget.select()}
                                    className="flex-1 border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c24e01]"
                                />
                                <button
                                    type="button"
                                    onClick={copyLink}
                                    className="shrink-0 border border-gray-700 px-3 py-2 text-xs text-gray-400 transition-colors focus:outline-none duration-200 hover:bg-[#a84301] hover:text-white focus:ring-2 focus:ring-[#c24e01]"
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleUploadAgain}
                                disabled={isNavigatingAway}
                                className="bg-gray-950 px-4 py-2 text-white transition-colors duration-200 hover:bg-[#a84301] focus:outline-none focus:ring-2 focus:ring-[#c24e01]"
                            >
                                {isNavigatingAway ? "Returning..." : "Upload Again"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default FileUploader;
