import Printer from "../Printer";
import ParserUtil from "../ParserUtil";
import Watcher from "./Watcher";
import { config } from "../../Server";

class PositionWatcher extends Watcher {

    private readonly printer: Printer;
    private readonly timer?: NodeJS.Timer;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;

        const pollRate = config.getNumber("misc.m114_poll_rate", 0.2);

        let requested = false;
        this.timer = setInterval(async () => {
            if (requested) return;
            requested = true;
            const response = await this.printer.queueGcode("M114 R", true, false);
            requested = false;
            this.readPosition(response);
        }, Math.round(pollRate * 1000));

        let last = 0;
        this.printer.on("actualPositionChange", (oldPos, newPos) => {
            const now = Date.now() / 1000;
            if (last) {
                const dxy = Math.sqrt((newPos[0] - oldPos[0]) ** 2 + (newPos[1] - oldPos[1]) ** 2);
                this.printer.actualSpeed = dxy / (now - last);
                const de = newPos[3] - oldPos[3];
                this.printer.actualExtruderSpeed = de / (now - last);
            }
            last = now;
        });
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

    public handle(_: string): boolean {
        return false;
    }
}

export default PositionWatcher;