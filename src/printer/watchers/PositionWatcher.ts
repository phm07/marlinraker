import Printer from "../Printer";
import ParserUtil from "../ParserUtil";
import Watcher from "./Watcher";

class PositionWatcher extends Watcher {

    private readonly printer: Printer;
    private readonly autoReport: boolean;
    private readonly timer?: NodeJS.Timer;

    public constructor(printer: Printer, reportVelocity: boolean) {
        super();
        this.printer = printer;
        this.autoReport = !reportVelocity && (printer.capabilities.AUTOREPORT_POS ?? printer.capabilities.AUTOREPORT_POSITION ?? false);

        if (this.autoReport) {
            if (!this.printer.isPrusa) {
                void this.printer.queueGcode("M154 S1", false, false);
            }
        } else {
            let requested = false;
            this.timer = setInterval(async () => {
                if (requested) return;
                requested = true;
                const response = await this.printer.queueGcode("M114", true, false);
                requested = false;
                this.readPosition(response);
            }, reportVelocity ? 200 : 1000);
        }

        if (reportVelocity) {
            let last = 0;
            printer.on("actualPositionChange", (oldPos, newPos) => {
                const now = Date.now() / 1000;
                if (last) {
                    const dxy = Math.sqrt((newPos[0] - oldPos[0]) ** 2 + (newPos[1] - oldPos[1]) ** 2);
                    this.printer.actualVelocity = dxy / (now - last);
                    const de = newPos[3] - oldPos[3];
                    this.printer.actualExtruderVelocity = de / (now - last);
                }
                last = now;
            });
        }
    }

    public handle(line: string): boolean {
        if (!this.autoReport || !line.startsWith("X:")) return false;
        this.readPosition(line);
        return true;
    }

    private readPosition(data: string): void {
        const actualPos = ParserUtil.parseM114Response(data);
        if (!actualPos) return;
        const oldPos = this.printer.actualPosition;
        this.printer.actualPosition = actualPos;
        this.printer.emit("actualPositionChange", oldPos, actualPos);
        super.onLoaded();
    }

    public cleanup(): void {
        clearInterval(this.timer);
    }
}

export default PositionWatcher;