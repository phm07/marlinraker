import Printer from "../Printer";
import ParserUtil from "../ParserUtil";
import Watcher from "./Watcher";

class TemperatureWatcher extends Watcher {

    private readonly printer: Printer;
    private readonly autoReport: boolean;
    private readonly timer?: NodeJS.Timer;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;
        this.autoReport = printer.capabilities.AUTOREPORT_TEMP ?? false;

        if (this.autoReport) {
            if (!printer.isPrusa) {
                void this.printer.queueGcode("M155 S1", false, false);
            }
        } else {
            let requested = false;
            this.timer = setInterval(async () => {
                if (requested) return;
                requested = true;
                const response = await this.printer.queueGcode("M105", true, false);
                requested = false;
                this.readTemps(response);
            }, 1000);
        }
    }

    private readTemps(data: string): void {
        const heaters = ParserUtil.parseM105Response(data);
        if (!heaters) return;
        this.printer.heaterManager.updateTemps(heaters);
        super.onLoaded();
    }

    public handle(line: string): boolean {
        if (!this.autoReport || !line.trim().startsWith("T")) return false;
        this.readTemps(line);
        return true;
    }

    public cleanup(): void {
        clearInterval(this.timer);
    }
}

export default TemperatureWatcher;