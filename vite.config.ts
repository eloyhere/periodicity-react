import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";

const repositoryName: string =
    process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "periodicity-react";
const base: string = process.env.GITHUB_ACTIONS === "true" ? `/${repositoryName}/` : "/";

// https://vite.dev/config/
export default defineConfig({
    base,
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
