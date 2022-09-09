import Printer from "../Printer";
import ParserUtil from "../ParserUtil";
import Watcher from "./Watcher";
import { marlinRaker } from "../../Server";

class PositionWatcher extends Watcher {

    private readonly printer: Printer;
    private readonly autoReport: boolean;
    private readonly timer?: NodeJS.Timer;

    public constructor(printer: Printer, autoReport: boolean) {
        super();
        this.printer = printer;
        this.autoReport = autoReport;

        if (autoReport) {
            void this.printer.queueGcode("M154 S1", false, false);
        } else {
            let requested = false;
            this.timer = setInterval(async () => {
                if (requested || marlinRaker.jobManager.currentPrintJob?.state === "printing") return;
                requested = true;
                const response = await this.printer.queueGcode("M114", true, false);
                requested = false;
                this.readPosition(response);
            }, 1000);
        }
    }

    private readPosition(data: string): void {
        this.printer.toolheadPosition = ParserUtil.parseM114Response(data);
        this.printer.emit("positionChange");
        super.onLoaded();
    }

    public handle(line: string): boolean {
        if (!this.autoReport || !line.startsWith("X:")) return false;
        this.readPosition(line);
        return true;
    }

    public delete(): void {
        this.timer && clearInterval(this.timer);
    }
}

export default PositionWatcher;