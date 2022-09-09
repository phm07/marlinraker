import FileDirectory from "./FileDirectory";
import { IDirectory } from "./IDirectory";
import SDCardDirectory from "./SDCardDirectory";

class GcodeDirectory extends FileDirectory {

    public constructor(root: IDirectory | null, path: string, dirname: string) {
        super(root, path, dirname);
    }

    public async getSubDirs(): Promise<IDirectory[]> {
        return [...(await super.getSubDirs()).filter((dir) => dir.dirname !== "SD"), new SDCardDirectory(this, "SD")];
    }

    public async getSubDir(name: string): Promise<IDirectory | null> {
        if (name === "SD") {
            return new SDCardDirectory(this, "SD");
        }
        return super.getSubDir(name);
    }
}

export default GcodeDirectory;