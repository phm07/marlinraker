import crypto from "crypto";

class HashUtils {

    public static hashStringMd5(data: string): string {
        const md5 = crypto.createHash("md5");
        return md5.update(data).digest("hex");
    }
}

export default HashUtils;