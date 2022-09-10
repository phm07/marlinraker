import unzip from "unzipper";
import * as https from "https";

class HttpsRequest {

    private static readonly USER_AGENT = "Mozilla/5.0 (Windows NT 6.2; rv:20.0) Gecko/20121202 Firefox/20.0";
    private readonly url: string;

    public constructor(url: string) {
        this.url = url;
    }

    public async getString(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            https.get(this.url, { headers: { "User-Agent": HttpsRequest.USER_AGENT } }, (res) => {
                const chunks: Buffer[] = [];
                res.on("error", reject);
                res.on("data", (buf) => chunks.push(buf));
                res.on("end", () => {
                    const result = Buffer.concat(chunks).toString("utf-8");
                    resolve(result);
                });
            });
        });
    }

    public async unzipTo(path: string, onProgress?: (progress: number, size: number) => void, onComplete?: () => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            https.get(this.url, { headers: { "User-Agent": HttpsRequest.USER_AGENT } }, (res) => {
                if (res.statusCode === 302 && res.headers["location"]) {
                    new HttpsRequest(res.headers["location"]).unzipTo(path, onProgress, onComplete).then(resolve).catch(reject);
                    return;
                }

                let progress = 0;
                const size = Number.parseInt(res.headers["content-length"] ?? "0");

                const timer = setInterval(() => {
                    onProgress?.(progress, size);
                }, 500);

                const outStream = unzip.Extract({ path });
                outStream.on("error", reject);
                res.on("error", reject);

                res.on("data", (buf) => {
                    progress += buf.length;
                    outStream.write(buf);
                });

                res.on("end", () => {
                    clearInterval(timer);
                    onComplete?.();
                });

                outStream.on("close", () => {
                    resolve();
                });
            });
        });
    }
}

export default HttpsRequest;