import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { axisLimits, bedMeshSection, homesAllAxes, parseKinematics } from "../../src/printer/Kinematics";

const cartesian = { kinematics: "cartesian" as const, printVolume: [220, 200, 250] as [number, number, number], printRadius: 110 };
const delta = { kinematics: "delta" as const, printVolume: [210, 210, 115] as [number, number, number], printRadius: 105 };

describe("parseKinematics", () => {
    it("accepts cartesian and delta", () => {
        assert.equal(parseKinematics("cartesian"), "cartesian");
        assert.equal(parseKinematics("delta"), "delta");
    });

    it("rejects anything else", () => {
        assert.equal(parseKinematics("corexy"), null);
        assert.equal(parseKinematics(3), null);
    });
});

describe("axisLimits", () => {
    it("starts a cartesian printer at the origin", () => {
        assert.deepEqual(axisLimits(cartesian), { minimum: [0, 0, 0, 0], maximum: [220, 200, 250, 0] });
    });

    it("centers a delta printer on the origin", () => {
        assert.deepEqual(axisLimits(delta), { minimum: [-105, -105, 0, 0], maximum: [105, 105, 115, 0] });
    });
});

describe("bedMeshSection", () => {
    it("keeps the rectangular mesh of a cartesian printer", () => {
        assert.deepEqual(bedMeshSection(cartesian), { mesh_min: "0, 0", mesh_max: "220, 200" });
    });

    it("describes a round mesh for a delta printer", () => {
        assert.deepEqual(bedMeshSection(delta), {
            mesh_min: "-105, -105",
            mesh_max: "105, 105",
            mesh_radius: 105,
            mesh_origin: "0, 0"
        });
    });
});

describe("homesAllAxes", () => {
    it("is true only for delta printers", () => {
        assert.equal(homesAllAxes("delta"), true);
        assert.equal(homesAllAxes("cartesian"), false);
    });
});
