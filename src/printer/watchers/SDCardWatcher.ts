import Watcher from "./Watcher";
import { marlinRaker } from "../../Server";
import ParserUtil, { TFileInfo } from "../ParserUtil";
import SimpleNotification from "../../api/notifications/SimpleNotification";

class SDCardWatcher extends Watcher {

    private readonly timer: NodeJS.Timer;

    // this watcher is very resource intensive, unfortunately marlin leaves us no other option
    public constructor(sdCardVirtualFolder: string) {
        super();

        let fileList: Record<string, TFileInfo | undefined> | null = null, requested = false;
        const handler = async (): Promise<void> => {
            if (requested || marlinRaker.jobManager.currentPrintJob?.state === "printing" || !marlinRaker.printer?.isSdCard) return;
            requested = true;
            const response = await marlinRaker.printer!.queueGcode("M20", false, false);
            const newFileList = ParserUtil.parseM20Response(response);
            if (fileList) {
                for (const filename in newFileList) {
                    const file = newFileList[filename]!;
                    const item = {
                        path: `${sdCardVirtualFolder}/${filename}`,
                        root: "gcodes",
                        size: file.size,
                        modified: Date.now() / 1000
                    };
                    if (!fileList[filename]) {
                        await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_filelist_changed", [
                            { action: "create_file", item }
                        ]));
                    } else if (JSON.stringify(fileList[filename]) !== JSON.stringify(newFileList[filename])) {
                        await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_filelist_changed", [
                            { action: "modify_file", item }
                        ]));
                    }
                }
                for (const filename in fileList) {
                    if (newFileList[filename]) continue;
                    const file = fileList[filename]!;
                    const item = {
                        path: `${sdCardVirtualFolder}/${filename}`,
                        root: "gcodes",
                        size: file.size,
                        modified: Date.now() / 1000
                    };
                    await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_filelist_changed", [
                        { action: "delete_file", item }
                    ]));
                }
            }
            fileList = newFileList;
            requested = false;
        };

        void handler();
        this.timer = setInterval(handler, 15000);
        this.onLoaded();
    }

    public delete(): void {
        clearInterval(this.timer);
    }

    public handle(_: string): boolean {
        return false;
    }
}

export default SDCardWatcher;