class StringUtil {
    public static errorToString(e: unknown): string {
        if (e instanceof Error) {
            return e.message;
        }
        return String(e);
    }

    public static getDeepKeys(obj: object): string[] {
        const keys = [];
        for (const key in obj) {
            const value = (obj as Record<string, object>)[key];
            if (typeof value === "object" && !Array.isArray(value)) {
                keys.push(key);
                const subKeys = StringUtil.getDeepKeys(value);
                keys.push(...subKeys.map((s) => `${key}.${s}`));
            }
        }
        return keys;
    }
}

export default StringUtil;