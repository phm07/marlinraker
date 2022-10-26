import express from "express";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { rootDir, router } from "../../Server";
import MarlinRaker from "../../MarlinRaker";

class FileHandler {

    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
        this.handleUpload("/server/files/upload");
        this.handleDelete();
        FileHandler.handleDownload();
    }

    private static handleDownload(): void {
        router.use("/server/files/gcodes/", express.static(path.join(rootDir, "gcodes")));
        router.use("/server/files/config/", express.static(path.join(rootDir, "config")));
    }

    private handleDelete(): void {
        router.delete("/server/files/:filepath(*)", async (req, res) => {
            const filepath = req.params.filepath;
            try {
                const response = await this.marlinRaker.fileManager.deleteFile(filepath);
                res.send(response);
            } catch (e) {
                res.status(400).send(e);
            }
        });
    }

    public handleUpload(url: string): void {
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
                response = await this.marlinRaker.fileManager.uploadFile(root, filepath, filename, source);
            } catch (e) {
                res.status(400).send(e);
                return;
            }

            if (print) {
                await this.marlinRaker.jobManager.selectFile(path.join("gcodes", filepath, filename)
                    .replaceAll("\\", "/"));
                await this.marlinRaker.dispatchCommand("start_print", false);

                res.send({
                    ...response,
                    print_started: this.marlinRaker.jobManager.isPrinting()
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