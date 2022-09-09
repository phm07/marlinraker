import Printer from "./Printer";
import { THeaters } from "./ParserUtil";
import HeaterObject from "./objects/TemperatureObject";
import HeatersObject from "./objects/HeatersObject";

interface ITempObject {
    temperatures?: number[];
    targets?: number[];
    powers?: number[];
}

type TTempRecords = Record<string, ITempObject | undefined>;

class HeaterManager {

    public readonly records: TTempRecords;
    public readonly klipperHeaterNames: Record<string, string | undefined>;
    private readonly printer: Printer;
    private readonly heatersObject: HeatersObject;
    private readonly heaterObjects: Record<string, HeaterObject | undefined>;

    public constructor(printer: Printer) {
        this.printer = printer;
        this.records = {};
        this.klipperHeaterNames = {};
        this.heaterObjects = {};
        this.heatersObject = new HeatersObject();
        this.printer.objectManager.objects[this.heatersObject.name] = this.heatersObject;
    }

    public updateTemps(heaters: THeaters): void {
        for (const heaterName in heaters) {
            const heater = heaters[heaterName];

            let klipperName = this.klipperHeaterNames[heaterName];
            if (!klipperName) {
                klipperName = heaterName;
                if (heaterName.startsWith("T")) {
                    const id = heaterName.length > 1 ? Number.parseInt(heaterName.substring(1)) : 0;
                    klipperName = id ? "extruder" + id : "extruder";
                } else if (heaterName === "B") {
                    klipperName = "heater_bed";
                } else if (heaterName === "A") {
                    klipperName = "temperature_sensor ambient";
                } else if (heaterName === "P") {
                    klipperName = "temperature_sensor pinda";
                }
                this.klipperHeaterNames[heaterName] = klipperName;
            }

            let heaterObject = this.heaterObjects[heaterName];
            if (!heaterObject) {
                heaterObject = new HeaterObject(klipperName);
                this.heatersObject.available_sensors.push(klipperName);
                if (heater.power !== undefined) {
                    this.heatersObject.available_heaters.push(klipperName);
                }
                this.heatersObject.emit();
                this.heaterObjects[heaterName] = heaterObject;
                this.heaterObjects[heaterName]!.emit();

                this.printer.objectManager.objects[klipperName] = heaterObject;
                this.records[klipperName] = {
                    temperatures: heater.temp !== undefined ? [] : undefined,
                    targets: heater.target !== undefined ? [] : undefined,
                    powers: heater.power !== undefined ? [] : undefined
                };
            }

            HeaterManager.addTempRecord(this.records[klipperName], "temperatures", heater.temp, 1200);
            HeaterManager.addTempRecord(this.records[klipperName], "targets", heater.target, 1200);
            HeaterManager.addTempRecord(this.records[klipperName], "powers", heater.power, 1200);

            heaterObject.temp = heater.temp;
            heaterObject.target = heater.target;
            heaterObject.power = heater.power;
            heaterObject.emit();
        }
    }

    private static addTempRecord(heaterObject: ITempObject | undefined, property: keyof ITempObject, record: number | undefined, cap: number): number[] | undefined {
        if (!heaterObject) return;
        const arr = heaterObject[property];
        if (!arr) return;
        arr.push(record ?? 0);
        heaterObject[property] = new Array(Math.max(0, cap - arr.length)).fill(0).concat(arr.slice(-cap));
    }
}

export { TTempRecords };
export default HeaterManager;