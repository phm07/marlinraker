import { Updatable } from "./Updatable";
import { spawn, exec } from "child_process";
import readline from "readline";
import { logger, marlinRaker } from "../Server";

type TInfo = {
    package_count: number,
    package_list: string[]
};

class SystemUpdatable extends Updatable<TInfo> {

    private packages: string[];

    public constructor() {
        super("system");
        this.packages = [];
    }

    public async checkForUpdate(): Promise<void> {
        if (process.platform !== "linux") return;

        return new Promise<void>((resolve, reject) => {
            exec("sudo apt update", (err) => {
                if (err) {
                    reject(err);
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
                    resolve();
                });
            });
        });
    }

    public isUpdatePossible(): boolean {
        return this.packages.length > 0;
    }

    public async update(): Promise<void> {
        if (!this.isUpdatePossible()) throw "No packages to upgrade";
        const log = this.createLogger();
        await log(`Upgrading ${this.packages.length} packages`);
        await this.doUpdate(log, "sudo", ["apt", "upgrade", "-y"]);
        this.packages = [];
        this.updateInfo();
        await marlinRaker.updateManager.emit();
    }

    private updateInfo(): void {
        this.info = {
            package_count: this.packages.length,
            package_list: this.packages
        };
    }
}

export default SystemUpdatable;