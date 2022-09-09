import { IUpdatable } from "./IUpdatable";
import path from "path";
import fs from "fs-extra";
import { logger, marlinRaker } from "../Server";
import HttpsRequest from "./HttpsRequest";
import crypto from "crypto";
import { spawn } from "child_process";
import readline from "readline";

type TReleaseMetadata = {
    id: number,
    tag_name: string,
    assets: [{
        browser_download_url: string
    }]
};

type TInfo = {
    name: string;
    owner: string;
    version: string;
    remote_version: string;
    configured_type: string;
    channel: string;
    info_tags: string[];
};

class GithubReleaseUpdatable implements IUpdatable<TInfo> {

    public readonly name: string;
    private readonly dir: string;
    private readonly repo: string;
    private currentVersion?: string;
    private latestRelease?: TReleaseMetadata;
    public info?: TInfo;

    public constructor(name: string, dir: string, repo: string) {
        this.name = name;
        this.dir = dir;
        this.repo = repo;
    }

    public async checkForUpdate(): Promise<void> {
        if (!this.repo) return;
        const versionFilePath = path.join(this.dir, ".version");
        if (await fs.pathExists(versionFilePath)) {
            try {
                this.currentVersion = (await fs.readFile(versionFilePath)).toString("utf-8");
            } catch (_) {
                //
            }
        } else {
            delete this.currentVersion;
        }

        this.latestRelease = await this.getLatestRelease() ?? undefined;

        if (!this.currentVersion && this.latestRelease) {
            await marlinRaker.updateManager.update(this.name);
        } else {
            this.updateInfo();
            await marlinRaker.updateManager.emit();
        }
    }

    public async update(): Promise<void> {

        if (!this.latestRelease) throw "No update to download";
        const procId = crypto.randomBytes(4).readUInt32LE();
        const log = async (message: string, complete = false): Promise<void> => {
            logger.info(message);
            await marlinRaker.updateManager.notifyUpdateResponse(this.name, procId, message, complete);
        };

        await log(`Downloading ${this.latestRelease.assets[0].browser_download_url}`);

        await fs.emptyDir(this.dir);
        await new HttpsRequest(this.latestRelease.assets[0].browser_download_url).unzipTo(this.dir, async (progress, size) => {
            const percent = Math.round(progress / size * 100);
            await log(`Download progress: ${percent}%`);
        }, async () => {
            await log("Download complete. Unzipping...");
        });

        const versionFilePath = path.join(this.dir, ".version");
        await fs.writeFile(versionFilePath, this.latestRelease.tag_name);

        if (await fs.pathExists(path.join(this.dir, "package.json"))) {
            await log("Installing npm packages");
            await new Promise<void>((resolve) => {
                const process = spawn("npm", ["install"]);
                const lineReader = readline.createInterface(process.stdout);
                lineReader.on("line", async (line) => {
                    await marlinRaker.updateManager.notifyUpdateResponse(this.name, procId, line, false);
                });
                lineReader.on("close", resolve);
            });
        }

        this.currentVersion = this.latestRelease.tag_name;
        await log("Update complete", true);
        this.updateInfo();
    }

    private async getLatestRelease(): Promise<TReleaseMetadata | null> {
        try {
            const response = await new HttpsRequest(`https://api.github.com/repos/${this.repo}/releases/latest`).getString();
            const metadata = JSON.parse(response);

            if ("id" in metadata && typeof metadata.id === "number"
                && "tag_name" in metadata && typeof metadata.tag_name === "string"
                && "assets" in metadata && typeof metadata.assets === "object"
                && 0 in metadata.assets && typeof metadata.assets[0] === "object"
                && "browser_download_url" in metadata.assets[0] && typeof metadata.assets[0].browser_download_url === "string") {

                return metadata;
            }
        } catch (e) {
            logger.error(e);
        }

        return null;
    }

    private updateInfo(): void {
        const [owner, name] = this.repo.split("/");
        this.info = {
            name,
            owner,
            version: this.currentVersion ?? "?",
            remote_version: this.latestRelease?.tag_name ?? "?",
            configured_type: "web",
            channel: "stable",
            info_tags: []
        };
    }
}

export default GithubReleaseUpdatable;