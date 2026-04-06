import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        outDir: "../public",
        emptyOutDir: true,
    },
    server: {
        proxy: {
            "/auth": "http://localhost:3000",
            "/upload": "http://localhost:3000",
            "/download": "http://localhost:3000",
        },
    },
});
