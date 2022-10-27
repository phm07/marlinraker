import PrinterObject from "./PrinterObject";
import MarlinRaker from "../../MarlinRaker";

interface IObject {
    is_active: boolean;
    progress: number;
    file_path: string;
    file_position: number;
    file_size: number;
}

class VirtualSdCardObject extends PrinterObject<IObject> {

    public readonly name = "virtual_sdcard";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;

        this.marlinRaker.jobManager.on("stateChange", this.emit.bind(this));
        this.marlinRaker.jobManager.on("progressUpdate", this.emit.bind(this));
    }

    public get(_: string[] | null): IObject {
        return {
            is_active: this.marlinRaker.jobManager.state === "printing",
            progress: this.marlinRaker.jobManager.currentPrintJob?.progress ?? 0,
            file_path: this.marlinRaker.jobManager.currentPrintJob?.filepath ?? "",
            file_position: this.marlinRaker.jobManager.currentPrintJob?.filePosition ?? 0,
            file_size: this.marlinRaker.jobManager.currentPrintJob?.fileSize ?? 0
        };
    }
}

export default VirtualSdCardObject;