import { Updatable } from "./Updatable";
import { spawn } from "child_process";
import readline from "readline";
import { logger } from "../Server";
import MarlinRaker from "../MarlinRaker";

interface IInfo {
    package_count: number;
    package_list: string[];
}

class SystemUpdatable extends Updatable<IInfo> {

    private packages: string[];

    public constructor(marlinRaker: MarlinRaker) {
        super(marlinRaker, "system");
        this.packages = [];
    }

    public async checkForUpdate(): Promise<void> {
        if (process.platform !== "linux") return;
        return new Promise<void>((resolve) => {
            let process;
            try {
                process = spawn("sudo", ["apt", "update"]);
            } catch (e) {
                logger.warn("Could not execute 'sudo apt update'");
                logger.debug(e);
                resolve();
                return;
            }

            process.on("exit", (code: number) => {
                if (code !== 0) {
                    logger.warn(`'sudo apt update' exited with error code ${code}`);
                    resolve();
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
                    await this.marlinRaker.updateManager.emit();
                    logger.info(`${this.packages.length} packages can be upgraded`);
                    resolve();
                });
            });
        });
    }

    public isUpdatePossible(): boolean {
        return this.packages.length > 0;
    }

    public async update(): Promise<void> {
        if (!this.isUpdatePossible()) throw new Error("No packages to upgrade");
        const log = this.createLogger();
        await log(`Upgrading ${this.packages.length} packages`);
        await this.doUpdate(log, "sudo", ["apt", "upgrade", "-y"]);
        this.packages = [];
        this.updateInfo();
        await this.marlinRaker.updateManager.emit();
    }

    private updateInfo(): void {
        this.info = {
            package_count: this.packages.length,
            package_list: this.packages
        };
    }
}

export default SystemUpdatable;