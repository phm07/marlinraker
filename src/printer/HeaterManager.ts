import Printer from "./Printer";
import { THeaters } from "./ParserUtil";
import TemperatureObject from "./objects/TemperatureObject";
import MarlinRaker from "../MarlinRaker";
import TypedEventEmitter from "../util/TypedEventEmitter";

interface ITempRecord {
    temperatures?: number[];
    targets?: number[];
    powers?: number[];
}

interface IHeaterManagerEvents {
    availableSensorsUpdate: () => void;
}

class HeaterManager extends TypedEventEmitter<IHeaterManagerEvents> {

    private static readonly RECORD_CAP = 1200;

    public readonly records: Map<string, ITempRecord>;
    public readonly klipperHeaterNames: Map<string, string>;
    public readonly availableHeaters: string[];
    public readonly availableSensors: string[];
    private readonly timer: NodeJS.Timer;
    private readonly tempObjects: Map<string, TemperatureObject>;
    private readonly marlinRaker: MarlinRaker;
    private readonly printer: Printer;

    public constructor(marlinRaker: MarlinRaker, printer: Printer) {
        super();
        this.marlinRaker = marlinRaker;
        this.printer = printer;
        this.availableHeaters = [];
        this.availableSensors = [];
        this.records = new Map();
        this.klipperHeaterNames = new Map();
        this.tempObjects = new Map();

        this.timer = setInterval(() => {
            for (const [_, tempObject] of this.tempObjects) {
                tempObject.emit();
            }
            this.updateTempRecords();
        }, 1000);
    }

    public updateTemps(heaters: THeaters): void {
        for (const heaterName in heaters) {
            const heater = heaters[heaterName];

            let klipperName = this.klipperHeaterNames.get(heaterName);
            if (!klipperName) {
                klipperName = heaterName;
                if (heaterName.startsWith("T")) {
                    const id = Number.parseInt(heaterName.substring(1)) || 0;
                    klipperName = id ? `extruder${id}` : "extruder";
                } else if (heaterName === "B") {
                    klipperName = "heater_bed";
                } else if (heaterName === "A") {
                    klipperName = "temperature_sensor ambient";
                } else if (heaterName === "P") {
                    klipperName = "temperature_sensor pinda";
                }
                this.klipperHeaterNames.set(heaterName, klipperName);
            }

            let tempObject = this.tempObjects.get(heaterName);
            if (!tempObject) {
                tempObject = new TemperatureObject(klipperName);
                this.tempObjects.set(heaterName, tempObject);
                this.marlinRaker.objectManager.objects.add(tempObject);

                this.availableSensors.push(klipperName);
                if (heater.power !== undefined) {
                    this.availableHeaters.push(klipperName);
                }

                const tempRecord: ITempRecord = {};
                if (heater.temp !== undefined) tempRecord.temperatures = new Array(HeaterManager.RECORD_CAP).fill(0);
                if (heater.target !== undefined) tempRecord.targets = new Array(HeaterManager.RECORD_CAP).fill(0);
                if (heater.power !== undefined) tempRecord.powers = new Array(HeaterManager.RECORD_CAP).fill(0);
                this.records.set(klipperName, tempRecord);

                this.emit("availableSensorsUpdate");
            }

            tempObject.temp = heater.temp ?? 0;
            tempObject.target = heater.target;
            tempObject.power = heater.power;
            tempObject.minTemp = Math.min(tempObject.minTemp ?? Infinity, tempObject.temp);
            tempObject.maxTemp = Math.max(tempObject.maxTemp ?? -Infinity, tempObject.temp);
        }
    }

    public cleanup(): void {
        clearInterval(this.timer);
        for (const [klipperName] of this.tempObjects) {
            this.marlinRaker.objectManager.objects.delete(klipperName);
        }
        this.removeAllListeners();
    }

    private updateTempRecords(): void {
        for (const [klipperName, record] of this.records) {
            const tempObject = this.tempObjects.get(klipperName);
            if (!tempObject) continue;
            this.updateTempRecord(record, "temperatures", tempObject.temp);
            this.updateTempRecord(record, "targets", tempObject.target);
            this.updateTempRecord(record, "powers", tempObject.power);
        }
    }

    private updateTempRecord(record: ITempRecord, recordKey: keyof ITempRecord, value?: number): void {
        const arr = record[recordKey];
        if (!arr) return;
        arr.push(value ?? 0);
        arr.shift();
    }
}

export { ITempRecord };
export default HeaterManager;