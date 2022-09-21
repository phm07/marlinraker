class StringUtil {
    public static errorToString(e: unknown): string {
        if (e instanceof Error) {
            return e.message;
        }
        return String(e);
    }
}

export default StringUtil;