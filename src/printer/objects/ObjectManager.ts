import { WebSocket } from "ws";
import PrinterObject from "./PrinterObject";
import SimpleNotification from "../../api/notifications/SimpleNotification";
import WebhooksObject from "./WebhooksObject";
import Printer from "../Printer";
import ToolheadObject from "./ToolheadObject";
import HeatersObject from "./HeatersObject";
import ConfigFileObject from "./ConfigFileObject";
import BedMeshObject from "./BedMeshObject";
import { config } from "../../Server";
import GcodeMoveObject from "./GcodeMoveObject";
import PrintStatsObject from "./PrintStatsObject";
import VirtualSdCardObject from "./VirtualSdCardObject";
import NamedObjectMap from "../../util/NamedObjectMap";
import FanObject from "./FanObject";

class ObjectManager {

    public readonly objects: NamedObjectMap<PrinterObject<unknown>>;
    private readonly printer: Printer;
    private subscriptions: { socket: WebSocket; unsubscribeAll: () => void }[] = [];

    public constructor(printer: Printer) {
        this.printer = printer;
        this.objects = new NamedObjectMap<PrinterObject<unknown>>([
            new WebhooksObject(this.printer),
            new ToolheadObject(this.printer),
            new GcodeMoveObject(this.printer),
            new FanObject(this.printer),
            new HeatersObject(),
            new ConfigFileObject(),
            new PrintStatsObject(),
            new VirtualSdCardObject(),
            config.getOrDefault<boolean>("printer.bed_mesh", false) && new BedMeshObject(this.printer)
        ]);
    }

    public subscribe(socket: WebSocket, objects: Record<string, string[] | null>): { eventtime: number; status: Record<string, unknown> } {

        const existing = this.subscriptions.find((subscription) => subscription.socket === socket);
        if (existing) {
            existing.unsubscribeAll();
            this.subscriptions = this.subscriptions.filter((subscription) => subscription !== existing);
        }

        const status: Record<string, unknown> = {};
        const unsubscribers: (() => void)[] = [];

        for (const objectName in objects) {
            const topics = objects[objectName];
            const object = this.objects[objectName];
            if (!object) continue;
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
}

export default ObjectManager;