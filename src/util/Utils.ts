type TVec2 = [number, number];
type TVec3 = [number, number, number];
type TVec4 = [number, number, number, number];

class Utils {
    public static errorToString(e: unknown): string {
        if (e instanceof Error) {
            return e.message;
        }
        return String(e);
    }

    public static getDeepKeys<T>(obj: T): string[] {
        const keys = [];
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === "object" && !Array.isArray(value)) {
                keys.push(key);
                const subKeys = Utils.getDeepKeys(value);
                keys.push(...subKeys.map((s) => `${key}.${s}`));
            }
        }
        return keys;
    }

    public static toLowerCaseKeys<T>(obj: T): object {
        const withLowercaseKeys: Record<string, unknown> = {};
        for (const key in obj) {
            const value = obj[key];
            withLowercaseKeys[key.toLowerCase()] = typeof value === "object" && !Array.isArray(value)
                ? this.toLowerCaseKeys(value) : value;
        }
        return withLowercaseKeys;
    }
}

export { TVec2, TVec3, TVec4 };
export default Utils;