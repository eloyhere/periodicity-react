/* eslint-disable @typescript-eslint/naming-convention */
import type { LocaleCode } from "../international";

/**
 * Localized names for the documentation groups and sections.
 * The keys are the English catalogue labels, so new entries inherit a stable
 * lookup without repeating the whole catalogue for every language.
 */
type LabelKey =
    | "Foundations"
    | "Components"
    | "Families"
    | "Actions"
    | "Inputs"
    | "Selection"
    | "Pickers"
    | "Feedback"
    | "Data"
    | "Layout"
    | "Navigation"
    | "Overlays"
    | "Menus"
    | "Messaging"
    | "Files"
    | "Display"
    | "Providers"
    | "Primitives";

type Labels = Readonly<Record<LabelKey, string>>;

const enGb: Labels = {
    Foundations: "Foundations",
    Components: "Components",
    Families: "Families",
    Actions: "Actions",
    Inputs: "Inputs",
    Selection: "Selection",
    Pickers: "Pickers",
    Feedback: "Feedback",
    Data: "Data",
    Layout: "Layout",
    Navigation: "Navigation",
    Overlays: "Overlays",
    Menus: "Menus",
    Messaging: "Messaging",
    Files: "Files",
    Display: "Display",
    Providers: "Providers",
    Primitives: "Primitives",
};

const enUs: Labels = {
    ...enGb,
    Display: "Display",
    Primitives: "Primitives",
};

const zh: Labels = {
    Foundations: "基础",
    Components: "组件",
    Families: "组件族",
    Actions: "操作",
    Inputs: "输入",
    Selection: "选择",
    Pickers: "选择器",
    Feedback: "反馈",
    Data: "数据",
    Layout: "布局",
    Navigation: "导航",
    Overlays: "浮层",
    Menus: "菜单",
    Messaging: "消息",
    Files: "文件",
    Display: "展示",
    Providers: "Provider",
    Primitives: "原语",
};

const zhHk: Labels = {
    ...zh,
    Foundations: "基礎",
    Data: "資料",
    Layout: "佈局",
    Navigation: "導覽",
    Files: "檔案",
    Providers: "Provider",
    Primitives: "原語",
};

const zhTw: Labels = {
    ...zh,
    Foundations: "基礎",
    Data: "資料",
    Layout: "版面",
    Navigation: "導覽",
    Files: "檔案",
    Primitives: "原語",
};

const ja: Labels = {
    Foundations: "基礎",
    Components: "コンポーネント",
    Families: "ファミリー",
    Actions: "アクション",
    Inputs: "入力",
    Selection: "選択",
    Pickers: "ピッカー",
    Feedback: "フィードバック",
    Data: "データ",
    Layout: "レイアウト",
    Navigation: "ナビゲーション",
    Overlays: "オーバーレイ",
    Menus: "メニュー",
    Messaging: "メッセージ",
    Files: "ファイル",
    Display: "表示",
    Providers: "プロバイダー",
    Primitives: "プリミティブ",
};

const ko: Labels = {
    Foundations: "기초",
    Components: "컴포넌트",
    Families: "패밀리",
    Actions: "액션",
    Inputs: "입력",
    Selection: "선택",
    Pickers: "선택기",
    Feedback: "피드백",
    Data: "데이터",
    Layout: "레이아웃",
    Navigation: "탐색",
    Overlays: "오버레이",
    Menus: "메뉴",
    Messaging: "메시지",
    Files: "파일",
    Display: "표시",
    Providers: "프로바이더",
    Primitives: "프리미티브",
};

const es: Labels = {
    Foundations: "Fundamentos",
    Components: "Componentes",
    Families: "Familias",
    Actions: "Acciones",
    Inputs: "Entradas",
    Selection: "Selección",
    Pickers: "Selectores",
    Feedback: "Comentarios",
    Data: "Datos",
    Layout: "Diseño",
    Navigation: "Navegación",
    Overlays: "Superposiciones",
    Menus: "Menús",
    Messaging: "Mensajería",
    Files: "Archivos",
    Display: "Visualización",
    Providers: "Proveedores",
    Primitives: "Primitivas",
};

const pt: Labels = {
    Foundations: "Fundamentos",
    Components: "Componentes",
    Families: "Famílias",
    Actions: "Ações",
    Inputs: "Entradas",
    Selection: "Seleção",
    Pickers: "Seletores",
    Feedback: "Feedback",
    Data: "Dados",
    Layout: "Layout",
    Navigation: "Navegação",
    Overlays: "Sobreposições",
    Menus: "Menus",
    Messaging: "Mensageria",
    Files: "Arquivos",
    Display: "Exibição",
    Providers: "Provedores",
    Primitives: "Primitivas",
};

const labels: Readonly<Record<LocaleCode, Labels>> = {
    "en-GB": enGb,
    "en-US": enUs,
    "zh-CN": zh,
    "zh-SG": zh,
    "zh-HK": zhHk,
    "zh-TW": zhTw,
    "ja-JP": ja,
    "ko-KR": ko,
    "es-ES": es,
    "es-MX": es,
    "pt-PT": pt,
    "pt-BR": pt,
};

/**
 * Resolves a documentation group or section label for the active locale.
 * @param label - English label from the catalogue.
 * @param locale - Active documentation locale.
 * @example
 * showcaseLabel("Display", "ja-JP"); // "表示"
 */
export const showcaseLabel: (label: string, locale: LocaleCode) => string = (
    label: string,
    locale: LocaleCode,
): string => {
    const dictionary: Labels = labels[locale] ?? enGb;
    return dictionary[label as LabelKey] ?? label;
};

const usSpellings: readonly [RegExp, string][] = [
    [/colour/gi, "color"],
    [/behaviour/gi, "behavior"],
    [/centred/gi, "centered"],
    [/customise/gi, "customize"],
    [/visualisation/gi, "visualization"],
    [/organise/gi, "organize"],
    [/licence/gi, "license"],
    [/labelled/gi, "labeled"],
    [/modelling/gi, "modeling"],
    [/signalling/gi, "signaling"],
    [/cancelled/gi, "canceled"],
    [/grey/gi, "gray"],
];

/**
 * Adapts British English documentation copy for the en-US shell.
 * @param text - British English source copy.
 * @example
 * toUsEnglish("Colour and behaviour"); // "Color and behavior"
 */
export const toUsEnglish: (text: string) => string = (text: string): string =>
    usSpellings.reduce(
        (result: string, [pattern, replacement]: readonly [RegExp, string]): string =>
            result.replace(pattern, replacement),
        text,
    );

/**
 * A localized, meaningful fallback for catalogue descriptions that have not
 * been individually translated yet.
 * @param name - English component name.
 * @param localizedName - Localized component name.
 * @param locale - Active documentation locale.
 * @example
 * fallbackDescription("Card", "Card カード", "ja-JP");
 */
export const fallbackDescription: (name: string, localizedName: string, locale: LocaleCode) => string = (
    name: string,
    localizedName: string,
    locale: LocaleCode,
): string => {
    if (locale.startsWith("zh")) {
        return `${localizedName}组件，用于产品界面中的相关任务。`;
    }

    if (locale.startsWith("ja")) {
        return `${localizedName}コンポーネント。プロダクト UI の関連タスクに使用します。`;
    }

    if (locale.startsWith("ko")) {
        return `${localizedName} 컴포넌트. 제품 UI의 관련 작업에 사용합니다.`;
    }

    if (locale.startsWith("es")) {
        return `Componente ${localizedName} para tareas relacionadas de la interfaz de producto.`;
    }

    if (locale.startsWith("pt")) {
        return `Componente ${localizedName} para tarefas relacionadas da interface do produto.`;
    }

    return `${name} component for related product-interface tasks.`;
};
