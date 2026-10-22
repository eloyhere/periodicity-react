import react from "@vitejs/plugin-react";

import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const entry: string = fileURLToPath(new URL("./src/library.ts", import.meta.url));

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        copyPublicDir: false,
        sourcemap: true,
        lib: {
            entry,
            name: "PeriodicityReact",
            formats: ["es"],
            fileName: "periodicity-react",
            cssFileName: "periodicity-react",
        },
        rollupOptions: {
            external: (id: string): boolean =>
                id === "react" ||
                id === "react-dom" || id.startsWith("react-dom/") ||
                id === "react/jsx-runtime" ||
                id === "codemirror" ||
                id.startsWith("@codemirror/"),
        },
    },
});


