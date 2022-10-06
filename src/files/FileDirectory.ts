import fs from "fs-extra";
import path from "path";
import { IDirectory } from "./IDirectory";
import { IFile } from "./IFile";
import PrintJob from "../printer/jobs/PrintJob";
import ErrnoException = NodeJS.ErrnoException;
import { rootDir } from "../Server";

class FileDirectory implements IDirectory {

    public readonly root: IDirectory;
    public readonly path: string;
    public readonly dirname: string;
    public readonly permissions: string;
    public size?: number | undefined;
    public modified?: number | undefined;

    public constructor(root: IDirectory | null, dirpath: string, dirname: string, fullyLoaded?: () => void) {
        this.path = dirpath;
        this.dirname = dirname;
        this.permissions = "rw";
        this.root = root ?? this;

        fs.pathExists(this.path).then(async (exists) => {
            if (!exists) {
                await fs.mkdirs(this.path);
            }
            const stat = await fs.stat(this.path);
            this.size = stat.size;
            this.modified = stat.mtimeMs / 1000;
            fullyLoaded?.();
        });
    }

    public async getFiles(): Promise<IFile[]> {
        const filenames = await fs.readdir(this.path);
        const files = (await Promise.all(filenames.map(async (file) => [
            file,
            await fs.stat(path.join(this.path, file))
        ])))
            .filter((stats) => (stats[1] as fs.Stats).isFile())
            .map((stats) => stats[0] as string);

        return (await Promise.all(files.map(async (name) => this.getFile(name))))
            .filter((file): file is IFile => file !== null);
    }

    public async getFile(name: string): Promise<IFile | null> {

        return new Promise<IFile | null>((resolve) => {
            fs.stat(path.join(this.path, name), (err, stat) => {
                if (err as ErrnoException | undefined) resolve(null);
                resolve({
                    filename: name,
                    modified: stat.mtimeMs / 1000,
                    permissions: "rw",
                    size: stat.size,
                    getPrintJob: () => new PrintJob(path.relative(
                        path.join(rootDir, "gcodes"), path.join(this.path, name)
                    ).replaceAll("\\", "/"))
                });
            });
        });
    }

    public async getSubDirs(): Promise<IDirectory[]> {
        const dirNames = await fs.readdir(this.path);
        const dirs = (await Promise.all(dirNames.map(async (dir) => [
            dir,
            await fs.stat(path.join(this.path, dir))
        ])))
            .filter((stats) => (stats[1] as fs.Stats).isDirectory())
            .map((stats) => stats[0] as string);

        return (await Promise.all(dirs.map(async (dir) => this.getSubDir(dir))))
            .filter((dir): dir is IDirectory => dir !== null);
    }

    public async getSubDir(name: string): Promise<IDirectory | null> {
        const subdirPath = path.join(this.path, name);
        if (await fs.pathExists(subdirPath)) {
            return new Promise<IDirectory | null>((resolve) => {
                const dir = new FileDirectory(this, path.join(this.path, name), name, () => {
                    resolve(dir);
                });
            });
        }
        return null;
    }
}

export default FileDirectory;