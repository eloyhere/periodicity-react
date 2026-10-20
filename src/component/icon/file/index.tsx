import { createIcon, type Icon } from "../types";

export type FileIconName =
    | "File"
    | "Folder"
    | "Document"
    | "Image"
    | "Video"
    | "Audio"
    | "Archive"
    | "Download"
    | "Upload"
    | "Link"
    | "Attachment"
    | "Clipboard";

export const fileIcons: Record<FileIconName, Icon> = {
    File: createIcon(
        "File",
        <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
            <path d="M14 3v5h5" />
        </>,
    ),
    Folder: createIcon(
        "Folder",
        <path d="M3.5 8a2 2 0 0 1 2-2h3.2l2 2.4h5.8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2Z" />,
    ),
    Document: createIcon(
        "Document",
        <>
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" />
        </>,
    ),
    Image: createIcon(
        "Image",
        <>
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
            <circle cx="8.8" cy="9.6" r="1.6" />
            <path d="m4.5 17.5 4.4-4.4a1.6 1.6 0 0 1 2.3 0l2.6 2.6" />
            <path d="m13.4 14.4 2.3-2.3a1.6 1.6 0 0 1 2.3 0l2.5 2.5" />
        </>,
    ),
    Video: createIcon(
        "Video",
        <>
            <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
            <path d="m15.5 10.6 5.5-2.9v8.6l-5.5-2.9Z" />
        </>,
    ),
    Audio: createIcon("Audio", <path d="M4 10v4M8 7v10M12 4.5v15M16 8v8M20 10.5v3" />),
    Archive: createIcon(
        "Archive",
        <>
            <rect x="3" y="4" width="18" height="4.5" rx="1.2" />
            <path d="M4.5 8.5v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-10" />
            <path d="M10 12.5h4" />
        </>,
    ),
    Download: createIcon(
        "Download",
        <>
            <path d="M12 3.5v10.5" />
            <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
            <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
        </>,
    ),
    Upload: createIcon(
        "Upload",
        <>
            <path d="M12 14.5V4" />
            <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
            <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
        </>,
    ),
    Link: createIcon(
        "Link",
        <>
            <path d="M10 13.9a3.9 3.9 0 0 0 5.5 0l2.6-2.6a3.9 3.9 0 0 0-5.5-5.5l-1.5 1.5" />
            <path d="M14 10.1a3.9 3.9 0 0 0-5.5 0l-2.6 2.6a3.9 3.9 0 0 0 5.5 5.5l1.5-1.5" />
        </>,
    ),
    Attachment: createIcon(
        "Attachment",
        <path d="M20 11.2 12.1 19a4.4 4.4 0 0 1-6.2-6.2l7.8-7.8a3 3 0 0 1 4.2 4.2l-7.8 7.8a1.5 1.5 0 0 1-2.1-2.1l7.2-7.2" />,
    ),
    Clipboard: createIcon(
        "Clipboard",
        <>
            <rect x="5.5" y="4.5" width="13" height="16.5" rx="2" />
            <rect x="8.5" y="2.5" width="7" height="4" rx="1.5" />
            <path d="M9.5 11.5h5M9.5 15.5h3.5" />
        </>,
    ),
};
