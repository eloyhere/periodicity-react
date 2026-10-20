import {
    resolveMessages,
    mergeMessages,
    type MessageDictionary,
    type ResolvedMessages,
} from "./messages";
import { defaultLocale, resolveLocaleCode, type LocaleCode } from "./locales";

/**
 * Vocabulary keys that every built-in dictionary provides.
 * Type: type alias.
 * Fields: none.
 * @example
 * const key: CommonMessageKey = "selectAll";
 */
export type CommonMessageKey =
    | "close"
    | "cancel"
    | "confirm"
    | "save"
    | "delete"
    | "edit"
    | "search"
    | "loading"
    | "retry"
    | "today"
    | "yesterday"
    | "tomorrow"
    | "previous"
    | "next"
    | "page"
    | "of"
    | "pageOf"
    | "select"
    | "clear"
    | "selectAll"
    | "deselectAll"
    | "required"
    | "optional"
    | "error"
    | "warning"
    | "success"
    | "info"
    | "empty"
    | "noResults"
    | "copy"
    | "copied"
    | "open"
    | "menu"
    | "more"
    | "back"
    | "continue"
    | "submit"
    | "reset"
    | "apply"
    | "dismiss"
    | "day"
    | "days"
    | "week"
    | "weeks"
    | "month"
    | "months"
    | "year"
    | "years"
    | "daysAgo"
    | "daysFromNow"
    | "monthsAgo"
    | "monthsFromNow"
    | "lastWeek"
    | "nextWeek"
    | "lastMonth"
    | "nextMonth";

/**
 * A complete built-in dictionary, including every common design-system key.
 * Type: type alias.
 * Fields: none.
 * @example
 * const messages: CommonMessages = builtInMessages["en-GB"];
 */
export type CommonMessages = MessageDictionary & Readonly<Record<CommonMessageKey, string>>;

/**
 * Built-in dictionaries keyed by canonical locale code.
 * Type: type alias.
 * Fields: none.
 * @example
 * const english: MessageDictionary = builtInMessages["en-GB"];
 */
export type BuiltInMessages = Readonly<Record<LocaleCode, CommonMessages>>;

/**
 * British English source dictionary and final translation fallback.
 */
const enGbMessages: CommonMessages = {
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    loading: "Loading",
    retry: "Retry",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    pageOf: "Page {page} of {pages}",
    select: "Select",
    clear: "Clear",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    required: "Required",
    optional: "Optional",
    error: "Error",
    warning: "Warning",
    success: "Success",
    info: "Info",
    empty: "Empty",
    noResults: "No results",
    copy: "Copy",
    copied: "Copied",
    open: "Open",
    menu: "Menu",
    more: "More",
    back: "Back",
    continue: "Continue",
    submit: "Submit",
    reset: "Reset",
    apply: "Apply",
    dismiss: "Dismiss",
    day: "Day",
    days: "Days",
    week: "Week",
    weeks: "Weeks",
    month: "Month",
    months: "Months",
    year: "Year",
    years: "Years",
    daysAgo: "{count} days ago",
    daysFromNow: "In {count} days",
    monthsAgo: "{count} months ago",
    monthsFromNow: "In {count} months",
    lastWeek: "Last week",
    nextWeek: "Next week",
    lastMonth: "Last month",
    nextMonth: "Next month",
};

/**
 * American English dictionary.
 */
const enUsMessages: CommonMessages = {
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    loading: "Loading",
    retry: "Retry",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    pageOf: "Page {page} of {pages}",
    select: "Select",
    clear: "Clear",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    required: "Required",
    optional: "Optional",
    error: "Error",
    warning: "Warning",
    success: "Success",
    info: "Info",
    empty: "Empty",
    noResults: "No results",
    copy: "Copy",
    copied: "Copied",
    open: "Open",
    menu: "Menu",
    more: "More",
    back: "Back",
    continue: "Continue",
    submit: "Submit",
    reset: "Reset",
    apply: "Apply",
    dismiss: "Dismiss",
    day: "Day",
    days: "Days",
    week: "Week",
    weeks: "Weeks",
    month: "Month",
    months: "Months",
    year: "Year",
    years: "Years",
    daysAgo: "{count} days ago",
    daysFromNow: "In {count} days",
    monthsAgo: "{count} months ago",
    monthsFromNow: "In {count} months",
    lastWeek: "Last week",
    nextWeek: "Next week",
    lastMonth: "Last month",
    nextMonth: "Next month",
};

/**
 * Mainland Simplified Chinese dictionary.
 */
const zhCnMessages: CommonMessages = {
    close: "关闭",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    search: "搜索",
    loading: "加载中",
    retry: "重试",
    today: "今天",
    yesterday: "昨天",
    tomorrow: "明天",
    previous: "上一个",
    next: "下一个",
    page: "页",
    of: "共",
    pageOf: "第 {page} 页，共 {pages} 页",
    select: "选择",
    clear: "清除",
    selectAll: "全选",
    deselectAll: "取消全选",
    required: "必填",
    optional: "可选",
    error: "错误",
    warning: "警告",
    success: "成功",
    info: "信息",
    empty: "暂无内容",
    noResults: "无匹配结果",
    copy: "复制",
    copied: "已复制",
    open: "打开",
    menu: "菜单",
    more: "更多",
    back: "返回",
    continue: "继续",
    submit: "提交",
    reset: "重置",
    apply: "应用",
    dismiss: "关闭",
    day: "天",
    days: "天",
    week: "周",
    weeks: "周",
    month: "个月",
    months: "个月",
    year: "年",
    years: "年",
    daysAgo: "{count} 天前",
    daysFromNow: "{count} 天后",
    monthsAgo: "{count} 个月前",
    monthsFromNow: "{count} 个月后",
    lastWeek: "上周",
    nextWeek: "下周",
    lastMonth: "上个月",
    nextMonth: "下个月",
};

/**
 * Singapore Simplified Chinese dictionary.
 */
const zhSgMessages: CommonMessages = {
    close: "关闭",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    search: "搜索",
    loading: "加载中",
    retry: "重试",
    today: "今天",
    yesterday: "昨天",
    tomorrow: "明天",
    previous: "上一个",
    next: "下一个",
    page: "页",
    of: "共",
    pageOf: "第 {page} 页，共 {pages} 页",
    select: "选择",
    clear: "清除",
    selectAll: "全选",
    deselectAll: "取消全选",
    required: "必填",
    optional: "可选",
    error: "错误",
    warning: "警告",
    success: "成功",
    info: "信息",
    empty: "暂无内容",
    noResults: "无匹配结果",
    copy: "复制",
    copied: "已复制",
    open: "打开",
    menu: "菜单",
    more: "更多",
    back: "返回",
    continue: "继续",
    submit: "提交",
    reset: "重置",
    apply: "应用",
    dismiss: "关闭",
    day: "天",
    days: "天",
    week: "周",
    weeks: "周",
    month: "个月",
    months: "个月",
    year: "年",
    years: "年",
    daysAgo: "{count} 天前",
    daysFromNow: "{count} 天后",
    monthsAgo: "{count} 个月前",
    monthsFromNow: "{count} 个月后",
    lastWeek: "上周",
    nextWeek: "下周",
    lastMonth: "上个月",
    nextMonth: "下个月",
};

/**
 * Hong Kong Traditional Chinese dictionary.
 */
const zhHkMessages: CommonMessages = {
    close: "關閉",
    cancel: "取消",
    confirm: "確認",
    save: "儲存",
    delete: "刪除",
    edit: "編輯",
    search: "搜尋",
    loading: "載入中",
    retry: "重試",
    today: "今天",
    yesterday: "昨天",
    tomorrow: "明天",
    previous: "上一個",
    next: "下一個",
    page: "頁",
    of: "共",
    pageOf: "第 {page} 頁，共 {pages} 頁",
    select: "選取",
    clear: "清除",
    selectAll: "全選",
    deselectAll: "取消全選",
    required: "必填",
    optional: "選填",
    error: "錯誤",
    warning: "警告",
    success: "成功",
    info: "資訊",
    empty: "暫無內容",
    noResults: "沒有結果",
    copy: "複製",
    copied: "已複製",
    open: "開啟",
    menu: "選單",
    more: "更多",
    back: "返回",
    continue: "繼續",
    submit: "提交",
    reset: "重設",
    apply: "套用",
    dismiss: "關閉",
    day: "日",
    days: "日",
    week: "星期",
    weeks: "星期",
    month: "個月",
    months: "個月",
    year: "年",
    years: "年",
    daysAgo: "{count} 日前",
    daysFromNow: "{count} 日後",
    monthsAgo: "{count} 個月前",
    monthsFromNow: "{count} 個月後",
    lastWeek: "上星期",
    nextWeek: "下星期",
    lastMonth: "上個月",
    nextMonth: "下個月",
};

/**
 * Taiwan Traditional Chinese dictionary.
 */
const zhTwMessages: CommonMessages = {
    close: "關閉",
    cancel: "取消",
    confirm: "確認",
    save: "儲存",
    delete: "刪除",
    edit: "編輯",
    search: "搜尋",
    loading: "載入中",
    retry: "重試",
    today: "今天",
    yesterday: "昨天",
    tomorrow: "明天",
    previous: "上一個",
    next: "下一個",
    page: "頁",
    of: "共",
    pageOf: "第 {page} 頁，共 {pages} 頁",
    select: "選取",
    clear: "清除",
    selectAll: "全選",
    deselectAll: "取消全選",
    required: "必填",
    optional: "選填",
    error: "錯誤",
    warning: "警告",
    success: "成功",
    info: "資訊",
    empty: "暫無內容",
    noResults: "沒有結果",
    copy: "複製",
    copied: "已複製",
    open: "開啟",
    menu: "選單",
    more: "更多",
    back: "返回",
    continue: "繼續",
    submit: "提交",
    reset: "重設",
    apply: "套用",
    dismiss: "關閉",
    day: "天",
    days: "天",
    week: "週",
    weeks: "週",
    month: "個月",
    months: "個月",
    year: "年",
    years: "年",
    daysAgo: "{count} 天前",
    daysFromNow: "{count} 天後",
    monthsAgo: "{count} 個月前",
    monthsFromNow: "{count} 個月後",
    lastWeek: "上週",
    nextWeek: "下週",
    lastMonth: "上個月",
    nextMonth: "下個月",
};

/**
 * Japanese dictionary.
 */
const jaJpMessages: CommonMessages = {
    close: "閉じる",
    cancel: "キャンセル",
    confirm: "確認",
    save: "保存",
    delete: "削除",
    edit: "編集",
    search: "検索",
    loading: "読み込み中",
    retry: "再試行",
    today: "今日",
    yesterday: "昨日",
    tomorrow: "明日",
    previous: "前へ",
    next: "次へ",
    page: "ページ",
    of: "/",
    pageOf: "{pages} ページ中 {page} ページ",
    select: "選択",
    clear: "クリア",
    selectAll: "すべて選択",
    deselectAll: "選択を解除",
    required: "必須",
    optional: "任意",
    error: "エラー",
    warning: "警告",
    success: "成功",
    info: "情報",
    empty: "データがありません",
    noResults: "結果がありません",
    copy: "コピー",
    copied: "コピーしました",
    open: "開く",
    menu: "メニュー",
    more: "その他",
    back: "戻る",
    continue: "続行",
    submit: "送信",
    reset: "リセット",
    apply: "適用",
    dismiss: "閉じる",
    day: "日",
    days: "日",
    week: "週",
    weeks: "週",
    month: "か月",
    months: "か月",
    year: "年",
    years: "年",
    daysAgo: "{count} 日前",
    daysFromNow: "{count} 日後",
    monthsAgo: "{count} か月前",
    monthsFromNow: "{count} か月後",
    lastWeek: "先週",
    nextWeek: "来週",
    lastMonth: "先月",
    nextMonth: "来月",
};

/**
 * Korean dictionary.
 */
const koKrMessages: CommonMessages = {
    close: "닫기",
    cancel: "취소",
    confirm: "확인",
    save: "저장",
    delete: "삭제",
    edit: "편집",
    search: "검색",
    loading: "불러오는 중",
    retry: "다시 시도",
    today: "오늘",
    yesterday: "어제",
    tomorrow: "내일",
    previous: "이전",
    next: "다음",
    page: "페이지",
    of: "/",
    pageOf: "{pages}페이지 중 {page}페이지",
    select: "선택",
    clear: "지우기",
    selectAll: "전체 선택",
    deselectAll: "전체 선택 해제",
    required: "필수",
    optional: "선택 사항",
    error: "오류",
    warning: "경고",
    success: "성공",
    info: "정보",
    empty: "내용이 없습니다",
    noResults: "결과가 없습니다",
    copy: "복사",
    copied: "복사됨",
    open: "열기",
    menu: "메뉴",
    more: "더 보기",
    back: "뒤로",
    continue: "계속",
    submit: "제출",
    reset: "재설정",
    apply: "적용",
    dismiss: "닫기",
    day: "일",
    days: "일",
    week: "주",
    weeks: "주",
    month: "개월",
    months: "개월",
    year: "년",
    years: "년",
    daysAgo: "{count}일 전",
    daysFromNow: "{count}일 후",
    monthsAgo: "{count}개월 전",
    monthsFromNow: "{count}개월 후",
    lastWeek: "지난주",
    nextWeek: "다음 주",
    lastMonth: "지난달",
    nextMonth: "다음 달",
};

/**
 * Spain Spanish dictionary.
 */
const esEsMessages: CommonMessages = {
    close: "Cerrar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    search: "Buscar",
    loading: "Cargando",
    retry: "Reintentar",
    today: "Hoy",
    yesterday: "Ayer",
    tomorrow: "Mañana",
    previous: "Anterior",
    next: "Siguiente",
    page: "Página",
    of: "de",
    pageOf: "Página {page} de {pages}",
    select: "Seleccionar",
    clear: "Borrar",
    selectAll: "Seleccionar todo",
    deselectAll: "Deseleccionar todo",
    required: "Obligatorio",
    optional: "Opcional",
    error: "Error",
    warning: "Advertencia",
    success: "Éxito",
    info: "Información",
    empty: "Sin contenido",
    noResults: "Sin resultados",
    copy: "Copiar",
    copied: "Copiado",
    open: "Abrir",
    menu: "Menú",
    more: "Más",
    back: "Atrás",
    continue: "Continuar",
    submit: "Enviar",
    reset: "Restablecer",
    apply: "Aplicar",
    dismiss: "Descartar",
    day: "Día",
    days: "Días",
    week: "Semana",
    weeks: "Semanas",
    month: "Mes",
    months: "Meses",
    year: "Año",
    years: "Años",
    daysAgo: "Hace {count} días",
    daysFromNow: "Dentro de {count} días",
    monthsAgo: "Hace {count} meses",
    monthsFromNow: "Dentro de {count} meses",
    lastWeek: "La semana pasada",
    nextWeek: "La próxima semana",
    lastMonth: "El mes pasado",
    nextMonth: "El próximo mes",
};

/**
 * Mexican Spanish dictionary.
 */
const esMxMessages: CommonMessages = {
    close: "Cerrar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    search: "Buscar",
    loading: "Cargando",
    retry: "Reintentar",
    today: "Hoy",
    yesterday: "Ayer",
    tomorrow: "Mañana",
    previous: "Anterior",
    next: "Siguiente",
    page: "Página",
    of: "de",
    pageOf: "Página {page} de {pages}",
    select: "Seleccionar",
    clear: "Borrar",
    selectAll: "Seleccionar todo",
    deselectAll: "Deseleccionar todo",
    required: "Obligatorio",
    optional: "Opcional",
    error: "Error",
    warning: "Advertencia",
    success: "Éxito",
    info: "Información",
    empty: "Sin contenido",
    noResults: "Sin resultados",
    copy: "Copiar",
    copied: "Copiado",
    open: "Abrir",
    menu: "Menú",
    more: "Más",
    back: "Regresar",
    continue: "Continuar",
    submit: "Enviar",
    reset: "Restablecer",
    apply: "Aplicar",
    dismiss: "Descartar",
    day: "Día",
    days: "Días",
    week: "Semana",
    weeks: "Semanas",
    month: "Mes",
    months: "Meses",
    year: "Año",
    years: "Años",
    daysAgo: "Hace {count} días",
    daysFromNow: "En {count} días",
    monthsAgo: "Hace {count} meses",
    monthsFromNow: "En {count} meses",
    lastWeek: "La semana pasada",
    nextWeek: "La próxima semana",
    lastMonth: "El mes pasado",
    nextMonth: "El próximo mes",
};

/**
 * European Portuguese dictionary.
 */
const ptPtMessages: CommonMessages = {
    close: "Fechar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    search: "Pesquisar",
    loading: "A carregar",
    retry: "Voltar a tentar",
    today: "Hoje",
    yesterday: "Ontem",
    tomorrow: "Amanhã",
    previous: "Anterior",
    next: "Seguinte",
    page: "Página",
    of: "de",
    pageOf: "Página {page} de {pages}",
    select: "Selecionar",
    clear: "Limpar",
    selectAll: "Selecionar tudo",
    deselectAll: "Desmarcar tudo",
    required: "Obrigatório",
    optional: "Opcional",
    error: "Erro",
    warning: "Aviso",
    success: "Sucesso",
    info: "Informação",
    empty: "Sem conteúdo",
    noResults: "Sem resultados",
    copy: "Copiar",
    copied: "Copiado",
    open: "Abrir",
    menu: "Menu",
    more: "Mais",
    back: "Voltar",
    continue: "Continuar",
    submit: "Submeter",
    reset: "Repor",
    apply: "Aplicar",
    dismiss: "Fechar",
    day: "Dia",
    days: "Dias",
    week: "Semana",
    weeks: "Semanas",
    month: "Mês",
    months: "Meses",
    year: "Ano",
    years: "Anos",
    daysAgo: "Há {count} dias",
    daysFromNow: "Daqui a {count} dias",
    monthsAgo: "Há {count} meses",
    monthsFromNow: "Daqui a {count} meses",
    lastWeek: "A semana passada",
    nextWeek: "A próxima semana",
    lastMonth: "O mês passado",
    nextMonth: "O próximo mês",
};

/**
 * Brazilian Portuguese dictionary.
 */
const ptBrMessages: CommonMessages = {
    close: "Fechar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Salvar",
    delete: "Excluir",
    edit: "Editar",
    search: "Pesquisar",
    loading: "Carregando",
    retry: "Tentar novamente",
    today: "Hoje",
    yesterday: "Ontem",
    tomorrow: "Amanhã",
    previous: "Anterior",
    next: "Próximo",
    page: "Página",
    of: "de",
    pageOf: "Página {page} de {pages}",
    select: "Selecionar",
    clear: "Limpar",
    selectAll: "Selecionar tudo",
    deselectAll: "Desmarcar tudo",
    required: "Obrigatório",
    optional: "Opcional",
    error: "Erro",
    warning: "Aviso",
    success: "Sucesso",
    info: "Informação",
    empty: "Sem conteúdo",
    noResults: "Nenhum resultado",
    copy: "Copiar",
    copied: "Copiado",
    open: "Abrir",
    menu: "Menu",
    more: "Mais",
    back: "Voltar",
    continue: "Continuar",
    submit: "Enviar",
    reset: "Redefinir",
    apply: "Aplicar",
    dismiss: "Dispensar",
    day: "Dia",
    days: "Dias",
    week: "Semana",
    weeks: "Semanas",
    month: "Mês",
    months: "Meses",
    year: "Ano",
    years: "Anos",
    daysAgo: "Há {count} dias",
    daysFromNow: "Em {count} dias",
    monthsAgo: "Há {count} meses",
    monthsFromNow: "Em {count} meses",
    lastWeek: "Semana passada",
    nextWeek: "Próxima semana",
    lastMonth: "Mês passado",
    nextMonth: "Próximo mês",
};

/**
 * Built-in message dictionaries for every supported locale.
 * Type: constant.
 * Fields: one complete dictionary per locale code.
 * @example
 * const close = builtInMessages["ja-JP"].close;
 */
/* eslint-disable @typescript-eslint/naming-convention -- BCP 47 locale tags are hyphenated keys by definition. */
export const builtInMessages: BuiltInMessages = {
    "en-GB": enGbMessages,
    "en-US": enUsMessages,
    "zh-CN": zhCnMessages,
    "zh-SG": zhSgMessages,
    "zh-HK": zhHkMessages,
    "zh-TW": zhTwMessages,
    "ja-JP": jaJpMessages,
    "ko-KR": koKrMessages,
    "es-ES": esEsMessages,
    "es-MX": esMxMessages,
    "pt-PT": ptPtMessages,
    "pt-BR": ptBrMessages,
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Resolves active and fallback dictionaries for a locale, merging the built-in catalogue underneath caller messages.
 * Caller values always win, and missing keys fall through the fallback locale to British English.
 * @param locale - Active locale tag, which may be a custom tag outside the catalogue.
 * @param messages - Optional flat dictionary or locale-keyed dictionary map supplied by the caller.
 * @param fallbackLocale - Optional fallback locale tag; defaults to `en-GB`.
 * @example
 * const dictionaries = resolveLocaleMessages("zh-CN", { save: "存檔" });
 * @returns Active and fallback dictionaries with built-ins merged underneath the caller overrides.
 */
export const resolveLocaleMessages: (
    locale: string,
    messages?: MessageDictionary,
    fallbackLocale?: string,
) => ResolvedMessages = (
    locale: string,
    messages?: MessageDictionary,
    fallbackLocale?: string,
): ResolvedMessages => {
    const effectiveFallbackLocale: string = fallbackLocale ?? defaultLocale;
    const caller: ResolvedMessages =
        messages === (void 0)
            ? { active: (void 0), fallback: (void 0) }
            : resolveMessages(messages, locale, effectiveFallbackLocale);
    const activeCode: LocaleCode | void = resolveLocaleCode(locale);
    const fallbackCode: LocaleCode | void = resolveLocaleCode(effectiveFallbackLocale);
    const defaultDictionary: MessageDictionary = builtInMessages[defaultLocale];
    const activeBuiltIn: MessageDictionary | void =
        activeCode === (void 0) ? (void 0) : builtInMessages[activeCode];
    const fallbackBuiltIn: MessageDictionary =
        fallbackCode === (void 0)
            ? defaultDictionary
            : mergeMessages(defaultDictionary, builtInMessages[fallbackCode]);
    const active: MessageDictionary | void =
        activeBuiltIn === (void 0) ? caller.active : mergeMessages(activeBuiltIn, caller.active);

    return {
        active,
        fallback: mergeMessages(fallbackBuiltIn, caller.fallback),
    };
};
