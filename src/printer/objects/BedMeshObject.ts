import PrinterObject from "./PrinterObject";
import Printer from "../Printer";

type TObject = {
    profile_name: string;
    mesh_min: [number, number];
    mesh_max: [number, number];
    probed_matrix?: number[][];
    mesh_matrix?: number[][];
};

class BedMeshObject extends PrinterObject<TObject> {

    public readonly name = "bed_mesh";
    private readonly profile?: string;
    private readonly min: [number, number];
    private readonly max: [number, number];
    private readonly grid: number[][];

    public constructor(printer: Printer) {
        super();

        this.min = [0, 0];
        this.max = [0, 0];
        this.grid = [[]];

        printer.on("updateBedMesh", (args: {
            grid: number[][],
            min: [number, number],
            max: [number, number]
        }) => {
            Object.assign(this, args);
            this.emit();
        });
    }

    public get(_: string[] | null): TObject {
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