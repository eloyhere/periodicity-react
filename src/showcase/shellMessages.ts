/* eslint-disable @typescript-eslint/naming-convention */
import type { LocaleCode } from "../international";

/**
 * Keys for the documentation shell chrome.
 * Type: type alias.
 * Fields: none.
 * @example
 * const key: ShellMessageKey = "inputs";
 */
export type ShellMessageKey =
    | "inputs"
    | "data"
    | "layout"
    | "auxiliary"
    | "search"
    | "theme"
    | "language"
    | "about"
    | "aboutTitle"
    | "designSystem"
    | "dependencies"
    | "close"
    | "skip"
    | "backToTop"
    | "liveDemo"
    | "fullFamily"
    | "aboutLead";

/**
 * Localized documentation shell strings.
 * Type: type alias.
 * Fields: none.
 * @example
 * const messages = shellMessages["ja-JP"];
 */
export type ShellMessages = Readonly<Record<ShellMessageKey, string>>;

const en: ShellMessages = {
    inputs: "Inputs",
    data: "Data",
    layout: "Layout",
    auxiliary: "Auxiliary",
    search: "Search components",
    theme: "Theme",
    language: "Language",
    about: "About",
    aboutTitle: "About Periodicity",
    designSystem: "Design system",
    dependencies: "Dependencies",
    close: "Close",
    skip: "Skip to content",
    backToTop: "Back to top",
    liveDemo: "Live demo",
    fullFamily: "The full family page stays below.",
    aboutLead: "A Material-inspired React component library for product interfaces, admin tools, and data-heavy applications.",
};

/**
 * Shell strings for every built-in locale.
 * Type: constant.
 * Fields: none.
 * @example
 * const themeLabel = shellMessages["zh-CN"].theme;
 */
export const shellMessages: Readonly<Record<LocaleCode, ShellMessages>> = {
    "en-GB": en,
    "en-US": en,
    "zh-CN": {
        inputs: "输入组件",
        data: "数据组件",
        layout: "布局组件",
        auxiliary: "辅助组件",
        search: "搜索组件",
        theme: "主题",
        language: "语言",
        about: "关于",
        aboutTitle: "关于 Periodicity",
        designSystem: "设计系统",
        dependencies: "依赖组件",
        close: "关闭",
        skip: "跳到内容",
        backToTop: "返回顶部",
        liveDemo: "实时示例",
        fullFamily: "完整组件族页面保留在下方。",
        aboutLead: "面向产品界面、管理后台和数据密集型应用的 Material 风格 React 组件库。",
    },
    "zh-SG": {
        inputs: "输入组件",
        data: "数据组件",
        layout: "布局组件",
        auxiliary: "辅助组件",
        search: "搜索组件",
        theme: "主题",
        language: "语言",
        about: "关于",
        aboutTitle: "关于 Periodicity",
        designSystem: "设计系统",
        dependencies: "依赖组件",
        close: "关闭",
        skip: "跳到内容",
        backToTop: "返回顶部",
        liveDemo: "实时示例",
        fullFamily: "完整组件族页面保留在下方。",
        aboutLead: "面向产品界面、管理后台和数据密集型应用的 Material 风格 React 组件库。",
    },
    "zh-HK": {
        inputs: "輸入元件",
        data: "資料元件",
        layout: "佈局元件",
        auxiliary: "輔助元件",
        search: "搜尋元件",
        theme: "主題",
        language: "語言",
        about: "關於",
        aboutTitle: "關於 Periodicity",
        designSystem: "設計系統",
        dependencies: "依賴元件",
        close: "關閉",
        skip: "跳到內容",
        backToTop: "返回頂部",
        liveDemo: "即時示範",
        fullFamily: "完整元件族頁面保留在下方。",
        aboutLead: "適用於產品介面、管理後台和資料密集型應用的 Material 風格 React 元件庫。",
    },
    "zh-TW": {
        inputs: "輸入元件",
        data: "資料元件",
        layout: "版面元件",
        auxiliary: "輔助元件",
        search: "搜尋元件",
        theme: "主題",
        language: "語言",
        about: "關於",
        aboutTitle: "關於 Periodicity",
        designSystem: "設計系統",
        dependencies: "相依元件",
        close: "關閉",
        skip: "跳到內容",
        backToTop: "返回頂部",
        liveDemo: "即時示範",
        fullFamily: "完整元件族頁面保留在下方。",
        aboutLead: "適用於產品介面、管理後台和資料密集型應用的 Material 風格 React 元件庫。",
    },
    "ja-JP": {
        inputs: "入力",
        data: "データ",
        layout: "レイアウト",
        auxiliary: "補助",
        search: "コンポーネントを検索",
        theme: "テーマ",
        language: "言語",
        about: "概要",
        aboutTitle: "Periodicity について",
        designSystem: "デザインシステム",
        dependencies: "依存関係",
        close: "閉じる",
        skip: "コンテンツへスキップ",
        backToTop: "トップへ戻る",
        liveDemo: "ライブデモ",
        fullFamily: "完全なファミリーページは下にあります。",
        aboutLead: "プロダクト UI、管理ツール、データ中心のアプリのための Material 風 React コンポーネントライブラリ。",
    },
    "ko-KR": {
        inputs: "입력",
        data: "데이터",
        layout: "레이아웃",
        auxiliary: "보조",
        search: "컴포넌트 검색",
        theme: "테마",
        language: "언어",
        about: "정보",
        aboutTitle: "Periodicity 정보",
        designSystem: "디자인 시스템",
        dependencies: "의존성",
        close: "닫기",
        skip: "콘텐츠로 건너뛰기",
        backToTop: "맨 위로",
        liveDemo: "라이브 데모",
        fullFamily: "전체 패밀리 페이지는 아래에 있습니다.",
        aboutLead: "제품 인터페이스, 관리 도구, 데이터 중심 앱을 위한 Material 스타일 React 컴포넌트 라이브러리.",
    },
    "es-ES": {
        inputs: "Entradas",
        data: "Datos",
        layout: "Diseño",
        auxiliary: "Auxiliares",
        search: "Buscar componentes",
        theme: "Tema",
        language: "Idioma",
        about: "Acerca de",
        aboutTitle: "Acerca de Periodicity",
        designSystem: "Sistema de diseño",
        dependencies: "Dependencias",
        close: "Cerrar",
        skip: "Saltar al contenido",
        backToTop: "Volver arriba",
        liveDemo: "Demostración en vivo",
        fullFamily: "La página completa de la familia permanece abajo.",
        aboutLead: "Una biblioteca de componentes React de estilo Material para interfaces de producto, herramientas de administración y aplicaciones con muchos datos.",
    },
    "es-MX": {
        inputs: "Entradas",
        data: "Datos",
        layout: "Diseño",
        auxiliary: "Auxiliares",
        search: "Buscar componentes",
        theme: "Tema",
        language: "Idioma",
        about: "Acerca de",
        aboutTitle: "Acerca de Periodicity",
        designSystem: "Sistema de diseño",
        dependencies: "Dependencias",
        close: "Cerrar",
        skip: "Saltar al contenido",
        backToTop: "Volver arriba",
        liveDemo: "Demostración en vivo",
        fullFamily: "La página completa de la familia permanece abajo.",
        aboutLead: "Una biblioteca de componentes React de estilo Material para interfaces de producto, herramientas de administración y aplicaciones con muchos datos.",
    },
    "pt-PT": {
        inputs: "Entradas",
        data: "Dados",
        layout: "Esquema",
        auxiliary: "Auxiliares",
        search: "Pesquisar componentes",
        theme: "Tema",
        language: "Idioma",
        about: "Sobre",
        aboutTitle: "Sobre o Periodicity",
        designSystem: "Sistema de design",
        dependencies: "Dependências",
        close: "Fechar",
        skip: "Saltar para o conteúdo",
        backToTop: "Voltar ao topo",
        liveDemo: "Demonstração ao vivo",
        fullFamily: "A página completa da família permanece abaixo.",
        aboutLead: "Uma biblioteca de componentes React de estilo Material para interfaces de produto, ferramentas de administração e aplicações com muitos dados.",
    },
    "pt-BR": {
        inputs: "Entradas",
        data: "Dados",
        layout: "Layout",
        auxiliary: "Auxiliares",
        search: "Pesquisar componentes",
        theme: "Tema",
        language: "Idioma",
        about: "Sobre",
        aboutTitle: "Sobre o Periodicity",
        designSystem: "Sistema de design",
        dependencies: "Dependências",
        close: "Fechar",
        skip: "Pular para o conteúdo",
        backToTop: "Voltar ao topo",
        liveDemo: "Demonstração ao vivo",
        fullFamily: "A página completa da família permanece abaixo.",
        aboutLead: "Uma biblioteca de componentes React de estilo Material para interfaces de produto, ferramentas de administração e aplicações com muitos dados.",
    },
};
