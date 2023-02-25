import { WebSocket } from "ws";
import PrinterObject from "./PrinterObject";
import SimpleNotification from "../../api/notifications/SimpleNotification";
import WebhooksObject from "./WebhooksObject";
import ToolheadObject from "./ToolheadObject";
import HeatersObject from "./HeatersObject";
import ConfigFileObject from "./ConfigFileObject";
import BedMeshObject from "./BedMeshObject";
import GcodeMoveObject from "./GcodeMoveObject";
import PrintStatsObject from "./PrintStatsObject";
import VirtualSdCardObject from "./VirtualSdCardObject";
import NamedObjectMap from "../../util/NamedObjectMap";
import FanObject from "./FanObject";
import SystemStatsObject from "./SystemStatsObject";
import MotionReportObject from "./MotionReportObject";
import MarlinRaker from "../../MarlinRaker";
import IdleTimeoutObject from "./IdleTimeoutObject";
import PauseResumeObject from "./PauseResumeObject";

interface IPrinterObjects {
    eventtime: number;
    status: Record<string, unknown>;
}

class ObjectManager {

    public readonly objects: NamedObjectMap<PrinterObject<unknown>>;
    private subscriptions: { socket: WebSocket; unsubscribeAll: () => void }[] = [];

    public constructor(marlinRaker: MarlinRaker) {
        this.objects = new NamedObjectMap<PrinterObject<unknown>>([
            new WebhooksObject(marlinRaker),
            new ToolheadObject(marlinRaker),
            new FanObject(marlinRaker),
            new GcodeMoveObject(marlinRaker),
            new MotionReportObject(marlinRaker),
            new SystemStatsObject(),
            new HeatersObject(marlinRaker),
            new ConfigFileObject(marlinRaker),
            new PrintStatsObject(marlinRaker),
            new VirtualSdCardObject(marlinRaker),
            new IdleTimeoutObject(marlinRaker),
            new PauseResumeObject(marlinRaker),
            new BedMeshObject(marlinRaker)
        ]);
    }

    public subscribe(socket: WebSocket, objects: Record<string, string[] | null>): IPrinterObjects {

        const existing = this.subscriptions.find((subscription) => subscription.socket === socket);
        if (existing) {
            existing.unsubscribeAll();
            this.subscriptions = this.subscriptions.filter((subscription) => subscription !== existing);
        }

        const status: Record<string, unknown> = {};
        const unsubscribers: (() => void)[] = [];

        for (const objectName in objects) {
            const topics = objects[objectName];
            const object = this.objects.get(objectName);
            if (!object?.isAvailable()) continue;
            const subscriber = async (): Promise<void> => {
                const diff = object.getDifference(subscriber, topics);
                if (!Object.keys(diff).length) return;
                socket.send(await new SimpleNotification("notify_status_update", [
                    Object.fromEntries([[object.name, diff]]),
                    process.uptime()
                ]).toString());
            };
            object.subscribe(subscriber);
            unsubscribers.push(() => object.unsubscribe(subscriber));
            status[object.name] = object.getFull(subscriber, topics);
        }

        const closeListener = (): void => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
        socket.on("close", closeListener);
        unsubscribers.push(() => socket.off("close", closeListener));

        this.subscriptions.push({
            socket,
            unsubscribeAll() {
                unsubscribers.forEach((unsubscribe) => unsubscribe());
            }
        });

        return {
            eventtime: process.uptime(),
            status
        };
    }

    public query(objects: Record<string, string[] | null>): IPrinterObjects {

        const status: Record<string, unknown> = {};

        for (const objectName in objects) {
            const topics = objects[objectName];
            const object = this.objects.get(objectName);
            if (!object?.isAvailable()) continue;
            status[object.name] = object.query(topics);
        }

        return {
            eventtime: process.uptime(),
            status
        };
    }
}

export { IPrinterObjects };
export default ObjectManager;