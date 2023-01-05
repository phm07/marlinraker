import { config, logger } from "../Server";
import { exec, execSync } from "child_process";
import MarlinRaker from "../MarlinRaker";
import SimpleNotification from "../api/notifications/SimpleNotification";

interface IActiveService {
    active_state: string;
    sub_state: string;
}

class ServiceManager {

    public readonly activeServiceList: string[];
    public readonly activeServices: Record<string, IActiveService>;
    private readonly marlinRaker: MarlinRaker;
    private readonly allowedServices: string[];

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
        this.allowedServices = config.getStringArray("misc.allowed_services",
            ["marlinraker", "crowsnest", "MoonCord", "moonraker-telegram-bot",
                "KlipperScreen", "sonar", "webcamd"]);
        this.activeServices = this.getActiveServices();
        this.activeServiceList = Object.keys(this.activeServices);

        if (this.activeServiceList.length) {
            setInterval(this.updateServiceState.bind(this), 1000);
        }
    }

    public async systemctl(action: "start" | "stop" | "restart", service: string): Promise<void> {
        if (!this.activeServiceList.includes(service)) return;
        return new Promise<void>((resolve, reject) => {
            exec(`sudo systemctl ${action} ${service}`, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    private getActiveServices(): Record<string, IActiveService> {

        if (process.platform !== "linux") {
            logger.info("Not running on linux, service manager disabled");
            return {};
        }

        try {
            return Object.fromEntries(execSync("systemctl list-units --all --type=service --plain --no-legend")
                .toString("utf-8")
                .split("\n")
                .map((line) => line.split(".")[0])
                .filter((service) => this.allowedServices.includes(service))
                .map((service) => [
                    service,
                    {
                        active_state: "unknown",
                        sub_state: "unknown"
                    }
                ]));
        } catch (e) {
            logger.warn("Cannot get active system services, service manager disabled");
            logger.debug(e);
            return {};
        }
    }

    private updateServiceState(): void {
        exec(`systemctl show -p ActiveState,SubState --value ${this.activeServiceList.join(" ")}`, (error, stdout) => {
            if (error) return;
            const lines = stdout.split("\n").filter((line) => line !== "");
            for (let i = 0; i < this.activeServiceList.length; i++) {
                const service = this.activeServices[this.activeServiceList[i]];
                const oldActiveState = service.active_state;
                const oldSubState = service.sub_state;
                service.active_state = lines[i * 2];
                service.sub_state = lines[i * 2 + 1];
                if (service.active_state !== oldActiveState || service.sub_state !== oldSubState) {
                    void this.marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_service_state_changed", [
                        {
                            [this.activeServiceList[i]]: service
                        }
                    ]));
                }
            }
        });
    }
}

export { IActiveService };
export default ServiceManager;