/* eslint-disable @typescript-eslint/naming-convention -- Locale tags are external BCP 47 keys. */
import type { LocaleCode } from "../international";

/**
 * Copy shown by the Icon component catalogue.
 * Type: interface.
 * Fields: description, searchPlaceholder, searchLabel, empty, groups.
 * @example
 * const messages: IconMessages = resolveIconMessages("zh-CN");
 */
export interface IconMessages {
    readonly description: (count: number) => string;
    readonly searchPlaceholder: string;
    readonly searchLabel: string;
    readonly empty: (query: string) => string;
    readonly groups: Readonly<Record<string, string>>;
}

const en: IconMessages = {
    description: (count: number): string =>
        `${count} SVG icons, including animated glyphs. Search by name, category, or group.`,
    searchPlaceholder: "Search icons",
    searchLabel: "Search icons",
    empty: (query: string): string => `No icons match “${query}”.`,
    groups: {
        company: "Company",
        brand: "Brand",
        life: "Life",
        animal: "Animal",
        plant: "Plant",
        interaction: "Interaction",
        agent: "Agent",
        motion: "Motion",
        live: "Live",
        dynamic: "Dynamic",
        programming: "Programming",
        computer: "Computer",
        electronics: "Electronics",
        math: "Math",
    },
};

const zh: IconMessages = {
    description: (count: number): string =>
        `${count} 个 SVG 图标，包含动态图标；可按名称、分类或分组搜索。`,
    searchPlaceholder: "搜索图标",
    searchLabel: "搜索图标",
    empty: (query: string): string => `没有匹配“${query}”的图标。`,
    groups: {
        company: "公司",
        brand: "品牌",
        life: "生活",
        animal: "动物",
        plant: "植物",
        interaction: "交互",
        agent: "智能体",
        motion: "动态",
        live: "实时",
        dynamic: "SVG 动画",
        programming: "编程",
        computer: "计算机",
        electronics: "电子",
        math: "数学",
    },
};

const ja: IconMessages = {
    description: (count: number): string =>
        `${count} 個の SVG アイコン。アニメーションアイコンを含みます。名前、カテゴリ、グループで検索できます。`,
    searchPlaceholder: "アイコンを検索",
    searchLabel: "アイコンを検索",
    empty: (query: string): string => `「${query}」に一致するアイコンはありません。`,
    groups: {
        company: "会社",
        brand: "ブランド",
        life: "生活",
        animal: "動物",
        plant: "植物",
        interaction: "インタラクション",
        agent: "エージェント",
        motion: "モーション",
        live: "ライブ",
        dynamic: "SVG アニメーション",
        programming: "プログラミング",
        computer: "コンピューター",
        electronics: "電子",
        math: "数学",
    },
};

const ko: IconMessages = {
    description: (count: number): string =>
        `SVG 아이콘 ${count}개. 애니메이션 아이콘을 포함합니다. 이름, 카테고리 또는 그룹으로 검색하세요.`,
    searchPlaceholder: "아이콘 검색",
    searchLabel: "아이콘 검색",
    empty: (query: string): string => `“${query}”와 일치하는 아이콘이 없습니다.`,
    groups: {
        company: "회사",
        brand: "브랜드",
        life: "생활",
        animal: "동물",
        plant: "식물",
        interaction: "인터랙션",
        agent: "에이전트",
        motion: "모션",
        live: "라이브",
        dynamic: "SVG 애니메이션",
        programming: "프로그래밍",
        computer: "컴퓨터",
        electronics: "전자",
        math: "수학",
    },
};

const es: IconMessages = {
    description: (count: number): string =>
        `${count} iconos SVG, incluidos glifos animados. Busca por nombre, categoría o grupo.`,
    searchPlaceholder: "Buscar iconos",
    searchLabel: "Buscar iconos",
    empty: (query: string): string => `No hay iconos que coincidan con «${query}».`,
    groups: {
        company: "Empresa",
        brand: "Marca",
        life: "Vida",
        animal: "Animal",
        plant: "Planta",
        interaction: "Interacción",
        agent: "Agente",
        motion: "Movimiento",
        live: "En vivo",
        dynamic: "SVG animado",
        programming: "Programación",
        computer: "Informática",
        electronics: "Electrónica",
        math: "Matemáticas",
    },
};

const pt: IconMessages = {
    description: (count: number): string =>
        `${count} ícones SVG, incluindo glifos animados. Pesquise por nome, categoria ou grupo.`,
    searchPlaceholder: "Pesquisar ícones",
    searchLabel: "Pesquisar ícones",
    empty: (query: string): string => `Nenhum ícone corresponde a “${query}”.`,
    groups: {
        company: "Empresa",
        brand: "Marca",
        life: "Vida",
        animal: "Animal",
        plant: "Planta",
        interaction: "Interação",
        agent: "Agente",
        motion: "Movimento",
        live: "Ao vivo",
        dynamic: "SVG animado",
        programming: "Programação",
        computer: "Computador",
        electronics: "Eletrônica",
        math: "Matemática",
    },
};

const dictionaries: Partial<Record<LocaleCode, IconMessages>> = {
    "en-GB": en,
    "en-US": en,
    "zh-CN": zh,
    "zh-SG": zh,
    "zh-HK": zh,
    "zh-TW": zh,
    "ja-JP": ja,
    "ko-KR": ko,
    "es-ES": es,
    "es-MX": es,
    "pt-PT": pt,
    "pt-BR": pt,
};

/**
 * Resolves icon catalogue copy for a locale, falling back to English.
 * @param locale - Active locale tag.
 * @example
 * const messages: IconMessages = resolveIconMessages("zh-CN");
 * @returns Localized icon catalogue copy.
 */
export const resolveIconMessages: (locale: string) => IconMessages = (
    locale: string,
): IconMessages => dictionaries[locale as LocaleCode] ?? en;
