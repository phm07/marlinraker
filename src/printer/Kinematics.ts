import { TVec3, TVec4 } from "../util/Utils";

type TKinematics = "cartesian" | "delta";

const SUPPORTED_KINEMATICS: readonly TKinematics[] = ["cartesian", "delta"];

interface IMachineGeometry {
    kinematics: TKinematics;
    printVolume: TVec3;
    printRadius: number;
}

interface IAxisLimits {
    minimum: TVec4;
    maximum: TVec4;
}

function parseKinematics(value: unknown): TKinematics | null {
    return SUPPORTED_KINEMATICS.find((kinematics) => kinematics === value) ?? null;
}

function axisLimits(geometry: IMachineGeometry): IAxisLimits {
    const [x, y, z] = geometry.printVolume;
    if (geometry.kinematics === "delta") {
        const radius = geometry.printRadius;
        return { minimum: [-radius, -radius, 0, 0], maximum: [radius, radius, z, 0] };
    }
    return { minimum: [0, 0, 0, 0], maximum: [x, y, z, 0] };
}

function bedMeshSection(geometry: IMachineGeometry): Record<string, string | number> {
    const { minimum, maximum } = axisLimits(geometry);
    const section: Record<string, string | number> = {
        mesh_min: `${minimum[0]}, ${minimum[1]}`,
        mesh_max: `${maximum[0]}, ${maximum[1]}`
    };
    if (geometry.kinematics === "delta") {
        section.mesh_radius = geometry.printRadius;
        section.mesh_origin = "0, 0";
    }
    return section;
}

function homesAllAxes(kinematics: TKinematics): boolean {
    return kinematics === "delta";
}

export { TKinematics, IMachineGeometry, IAxisLimits, parseKinematics, axisLimits, bedMeshSection, homesAllAxes };
