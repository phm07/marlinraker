import PrinterObject from "./PrinterObject";
import Printer from "../Printer";
import { TVec2 } from "../../util/Utils";

interface IObject {
    profile_name: string;
    mesh_min: TVec2;
    mesh_max: TVec2;
    probed_matrix?: number[][];
    mesh_matrix?: number[][];
}

class BedMeshObject extends PrinterObject<IObject> {

    public readonly name = "bed_mesh";
    private readonly profile?: string;
    private readonly min: TVec2;
    private readonly max: TVec2;
    private readonly grid: number[][];

    public constructor(printer: Printer) {
        super();

        this.min = [0, 0];
        this.max = [0, 0];
        this.grid = [[]];

        printer.on("updateBedMesh", (bedMesh) => {
            Object.assign(this, bedMesh);
            this.emit();
        });
    }

    public get(_: string[] | null): IObject {
        return {
            profile_name: this.profile ?? "",
            mesh_min: this.min,
            mesh_max: this.max,
            mesh_matrix: this.grid,
            probed_matrix: this.grid
        };
    }
}

export default BedMeshObject;