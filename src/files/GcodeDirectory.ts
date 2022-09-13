import FileDirectory from "./FileDirectory";
import { IDirectory } from "./IDirectory";
import SDCardDirectory from "./SDCardDirectory";
import { marlinRaker } from "../Server";

class GcodeDirectory extends FileDirectory {

    public constructor(root: IDirectory | null, path: string, dirname: string) {
        super(root, path, dirname);
    }

    public async getSubDirs(): Promise<IDirectory[]> {
        if (marlinRaker.printer?.isSdCard) {
            return [...(await super.getSubDirs()).filter((dir) => dir.dirname !== "SD"), new SDCardDirectory(this, "SD")];
        }
        return super.getSubDirs();
    }

    public async getSubDir(name: string): Promise<IDirectory | null> {
        if (marlinRaker.printer?.isSdCard && name === "SD") {
            return new SDCardDirectory(this, "SD");
        }
        return super.getSubDir(name);
    }
}

export default GcodeDirectory;