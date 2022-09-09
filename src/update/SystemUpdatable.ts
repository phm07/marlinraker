import { IUpdatable } from "./IUpdatable";
import { spawn, exec } from "child_process";
import readline from "readline";
import { logger, marlinRaker } from "../Server";
import crypto from "crypto";

type TInfo = {
    package_count: number,
    package_list: string[]
};

class SystemUpdatable implements IUpdatable<TInfo> {

    public readonly name = "system";
    public info?: TInfo;
    private packages: string[];

    public constructor() {
        this.packages = [];
    }

    public checkForUpdate(): void {
        if (process.platform !== "linux") return;

        exec("sudo apt update", (err) => {
            if (err) {
                logger.error(err);
                return;
            }
            const proc = spawn("apt", ["list", "--upgradable"], { shell: true });
            const reader = readline.createInterface(proc.stdout);
            const newPackages: string[] = [];
            reader.on("line", (line) => {
                if (line === "Listing...") return;
                const packageName = line.split("/")[0];
                newPackages.push(packageName);
            });
            reader.on("close", async () => {
                this.packages = newPackages;
                this.updateInfo();
                await marlinRaker.updateManager.emit();
                logger.info(`${this.packages.length} packages can be upgraded`);
            });
        });
    }

    public async update(): Promise<void> {
        return new Promise<void>((resolve) => {
            logger.info(`Upgrading ${this.packages.length} packages`);
            const proc = spawn("sudo", ["apt", "upgrade", "-y"], { shell: true });
            const reader = readline.createInterface(proc.stdout);
            const procId = crypto.randomBytes(4).readUInt32LE();
            reader.on("line", async (line) => {
                await marlinRaker.updateManager.notifyUpdateResponse("system", procId, line, false);
            });
            reader.on("close", async () => {
                await marlinRaker.updateManager.notifyUpdateResponse("system", procId, "Done", true);
                this.packages = [];
                this.updateInfo();
                await marlinRaker.updateManager.emit();
                resolve();
                logger.info("Finished upgrading packages");
            });
        });
    }

    private updateInfo(): void {
        this.info = {
            package_count: this.packages.length,
            package_list: this.packages
        };
    }
}

export default SystemUpdatable;