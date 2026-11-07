import { describe, it } from "node:test";
import assert from "node:assert/strict";
import TemperatureObject from "../../src/printer/objects/TemperatureObject";

const status = (object: TemperatureObject): Record<string, unknown> => object.getFull(() => undefined, null);

describe("TemperatureObject can_extrude", () => {
    it("is false while an extruder is below min_extrude_temp", () => {
        const extruder = new TemperatureObject("extruder", 180);
        extruder.temp = 179.9;
        assert.equal(status(extruder).can_extrude, false);
    });

    it("is true once an extruder reaches min_extrude_temp", () => {
        const extruder = new TemperatureObject("extruder", 180);
        extruder.temp = 180;
        assert.equal(status(extruder).can_extrude, true);
    });

    it("is not reported for heaters that are not extruders", () => {
        const bed = new TemperatureObject("heater_bed");
        bed.temp = 60;
        assert.equal("can_extrude" in status(bed), false);
    });
});
