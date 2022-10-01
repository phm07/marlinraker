import PrinterObject from "./PrinterObject";
import { marlinRaker } from "../../Server";

interface IObject {
    is_active: boolean;
    progress: number;
    file_path: string;
    file_position: number;
    file_size: number;
}

class VirtualSdCardObject extends PrinterObject<IObject> {

    public readonly name = "virtual_sdcard";

    public constructor() {
        super();
    }

    protected get(_: string[] | null): IObject {
        return {
            is_active: marlinRaker.jobManager.currentPrintJob?.state === "printing",
            progress: marlinRaker.jobManager.currentPrintJob?.progress ?? 0,
            file_path: marlinRaker.jobManager.currentPrintJob?.filepath ?? "",
            file_position: marlinRaker.jobManager.currentPrintJob?.filePosition ?? 0,
            file_size: marlinRaker.jobManager.currentPrintJob?.fileSize ?? 0
        };
    }
}

export default VirtualSdCardObject;