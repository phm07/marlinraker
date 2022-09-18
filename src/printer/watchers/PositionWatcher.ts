import Printer from "../Printer";
import ParserUtil from "../ParserUtil";
import Watcher from "./Watcher";
import { marlinRaker } from "../../Server";

class PositionWatcher extends Watcher {

    private readonly printer: Printer;
    private readonly autoReport: boolean;
    private readonly timer?: NodeJS.Timer;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;
        this.autoReport = printer.capabilities.AUTOREPORT_POS ?? printer.capabilities.AUTOREPORT_POSITION ?? false;

        if (this.autoReport) {
            if (!printer.isPrusa) {
                void this.printer.queueGcode("M154 S1", false, false);
            }
        } else {
            let requested = false;
            this.timer = setInterval(async () => {
                if (requested || marlinRaker.jobManager.isPrinting()) return;
                requested = true;
                const response = await this.printer.queueGcode("M114", true, false);
                requested = false;
                this.readPosition(response);
            }, 1000);
        }
    }

    private readPosition(data: string): void {
        const toolheadPos = ParserUtil.parseM114Response(data);
        if (!toolheadPos) return;
        this.printer.toolheadPosition = toolheadPos;
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