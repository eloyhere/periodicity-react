export type Nullable<T> = T | undefined | null;
export type NonNull<T> = T extends null | undefined ? T : never;

export const isNull: (target: unknown) => target is null = (target: unknown): target is null => {
    return target === null;
};

export const isUndefined: (target: unknown) => target is undefined = (target: unknown): target is undefined => {
    return target === (void 0);
};

export const isBoolean: (target: unknown) => target is boolean = (target: unknown): target is boolean => {
    return typeof(target) === "boolean";
};

export const isNumber: (target: unknown) => target is number = (target: unknown): target is number => {
    return typeof(target) === "number";
};

export const isBigInt: (target: unknown) => target is bigint = (target: unknown): target is bigint => {
    return typeof(target) === "bigint";
};

export const isString: (target: unknown) => target is string = (target: unknown): target is string => {
    return typeof(target) === "string";
};

export const isSymbol: (target: unknown) => target is symbol = (target: unknown): target is symbol => {
    return typeof(target) === "symbol";
};

export const isObject: (target: unknown) => target is object = (target: unknown): target is object => {
    return typeof(target) === "object" && target !== null;
};

export const isFunction: (target: unknown) => target is CallableFunction = (target: unknown): target is CallableFunction => {
    return typeof(target) === "function";
};

export type Primitive = null | undefined | boolean | number | bigint | string | symbol | CallableFunction;

export const isPrimitive: (target: unknown) => target is Primitive = (target: unknown): target is Primitive => {
    return isNull(target) || isUndefined(target) || !isObject(target);
};

export const validate: <T>(target: Nullable<T>) => target is T = <T>(target: Nullable<T>): target is T => {
    return (target !== null) && (target !== (void 0));
};

export const invalidate: <T>(target: Nullable<T>) => target is T = <T>(target: Nullable<T>): target is T => {
    return (target === null) || (target === (void 0));
};