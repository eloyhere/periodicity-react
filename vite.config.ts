import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";

const repositoryName: string =
    process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "periodicity-react";
const base: string = process.env.GITHUB_ACTIONS === "true" ? `/${repositoryName}/` : "/";

// https://vite.dev/config/
export default defineConfig({
    base,
    server: {
        host: "127.0.0.1",
        port: 5200,
        hmr: true
    },
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
