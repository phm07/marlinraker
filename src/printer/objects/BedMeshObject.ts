import PrinterObject from "./PrinterObject";
import { TVec2 } from "../../util/Utils";
import MarlinRaker from "../../MarlinRaker";
import { config } from "../../Server";

interface IObject {
    profile_name: string;
    mesh_min: TVec2;
    mesh_max: TVec2;
    probed_matrix?: number[][];
    mesh_matrix?: number[][];
}

class BedMeshObject extends PrinterObject<IObject> {

    public readonly name = "bed_mesh";
    private readonly marlinRaker: MarlinRaker;
    private readonly isBedMesh: boolean;
    private readonly profile?: string;
    private readonly min: TVec2;
    private readonly max: TVec2;
    private readonly grid: number[][];

    public constructor(marlinRaker: MarlinRaker) {
        super();

        this.marlinRaker = marlinRaker;
        this.isBedMesh = config.getBoolean("printer.bed_mesh", false);
        this.min = [0, 0];
        this.max = [0, 0];
        this.grid = [[]];

        if (this.isBedMesh) {
            this.marlinRaker.on("stateChange", (state) => {
                if (state === "ready") {
                    this.marlinRaker.printer?.on("updateBedMesh", (bedMesh) => {
                        Object.assign(this, bedMesh);
                        this.emit();
                    });
                }
            });
        }
    }

    protected get(): IObject {
        return {
            profile_name: this.profile ?? "",
            mesh_min: this.min,
            mesh_max: this.max,
            mesh_matrix: this.grid,
            probed_matrix: this.grid
        };
    }

    public isAvailable(): boolean {
        return this.isBedMesh;
    }
}

export default BedMeshObject;