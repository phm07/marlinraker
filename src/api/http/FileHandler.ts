import express from "express";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { marlinRaker, rootDir, router } from "../../Server";

class FileHandler {

    public constructor() {
        FileHandler.handleUpload("/server/files/upload");
        FileHandler.handleDownload();
        FileHandler.handleDelete();
    }

    private static handleDownload(): void {
        router.use("/server/files/gcodes/", express.static(path.join(rootDir, "gcodes")));
        router.use("/server/files/config/", express.static(path.join(rootDir, "config")));
    }

    private static handleDelete(): void {
        router.delete("/server/files/:filepath(*)", async (req, res) => {
            const filepath = req.params.filepath;
            try {
                const response = await marlinRaker.fileManager.deleteFile(filepath);
                res.send(response);
            } catch (e) {
                res.status(400).send(e);
            }
        });
    }

    public static handleUpload(url: string): void {
        const upload = multer({ storage: multer.diskStorage({}) });

        router.post(url, upload.single("file"), async (req, res) => {

            if (!req.file) {
                res.status(400).send();
                return;
            }

            const checksum = req.body.checksum;
            const root = req.body.root ?? "gcodes";
            const filepath = req.body.path ?? "";
            const print = req.body.print === "true";
            const filename = req.file.originalname;
            const source = req.file.path;

            if (checksum) {
                const computedChecksum = await FileHandler.sha256(source);
                if (checksum !== computedChecksum) {
                    res.status(422).send();
                    await fs.remove(source);
                    return;
                }
            }

            let response;
            try {
                response = await marlinRaker.fileManager.uploadFile(root, filepath, filename, source);
            } catch (e) {
                res.status(400).send(e);
                return;
            }

            if (print) {
                await marlinRaker.jobManager.selectFile(path.join("gcodes", filepath, filename)
                    .replaceAll("\\", "/"));
                await marlinRaker.printer?.dispatchCommand("start_print");

                res.send({
                    ...response,
                    print_started: marlinRaker.jobManager.isPrinting()
                });
            } else {
                res.send(response);
            }
        });
    }

    private static async sha256(filepath: string): Promise<string> {
        return new Promise<string>((resolve) => {
            const hash = crypto.createHash("sha256");
            hash.setEncoding("hex");

            const stream = fs.createReadStream(filepath);

            stream.on("end", () => {
                hash.end();
                resolve(hash.read());
            });

            stream.pipe(hash);
        });
    }
}

export default FileHandler;