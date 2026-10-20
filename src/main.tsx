import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import TextContextMenu from "./component/context/TextContextMenu";
import Showcase from "./showcase/Showcase.tsx";

const page: ReactNode = window.location.hash === "#dashboard" ? <App /> : <Showcase />;

document.addEventListener("contextmenu", (event: MouseEvent): void => {
    event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        {page}
        <TextContextMenu />
    </StrictMode>,
);
