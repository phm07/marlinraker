import FileDirectory from "./FileDirectory";
import { IDirectory } from "./IDirectory";
import GcodeDirectory from "./GcodeDirectory";
import { IFile } from "./IFile";
import path from "path";
import { marlinRaker, rootDir } from "../Server";
import fs from "fs-extra";
import SimpleNotification from "../api/notifications/SimpleNotification";

interface IDirInfo {
    dirs: {
        modified?: number;
        size?: number;
        permissions: string;
        dirname: string;
    }[];
    files: {
        modified?: number;
        size?: number;
        permissions: string;
        filename: string;
    }[];
    disk_usage: {
        total: number;
        used: number;
        free: number;
    };
    root_info: {
        name: string;
        permissions: string;
    };
}

interface IFileInfo {
    path: string;
    modified: number;
    size: number;
    permissions: string;
}

interface IFileChangeNotification {
    item: {
        path: string;
        root: string;
        size?: number;
        modified?: number;

        // undocumented
        permissions: string;
    };
    source_item?: {
        path: string;
        root: string;
    };
    action: "create_dir" | "delete_dir" | "move_dir" | "create_file" | "delete_file" | "move_file";
}

class FileManager {

    private readonly directories: IDirectory[];

    public constructor() {
        this.directories = [
            new GcodeDirectory(null, path.join(rootDir, "gcodes"), "gcodes"),
            new FileDirectory(null, path.join(rootDir, "config"), "config")
        ];
    }

    public async getFile(filepath: string): Promise<IFile | null> {
        const parts = filepath.split("/").flatMap((s) => s.split("\\")).filter((s) => s);
        const filename = parts.pop();
        if (!filename) return null;
        const dirPath = parts.join("/");
        const dir = await this.getDirectory(dirPath);
        return dir?.getFile(filename) ?? null;
    }

    public async getDirectory(dirpath: string): Promise<IDirectory | null> {
        const pathArr = dirpath.split("/").flatMap((s) => s.split("\\")).filter((s) => s);
        const root = this.directories.find((dir) => dir.dirname === pathArr[0]);
        let currentDir = root;
        if (!root) return null;
        pathArr.shift();
        while (pathArr.length) {
            currentDir = await currentDir?.getSubDir(pathArr.shift() ?? "") ?? undefined;
        }
        return currentDir ?? null;
    }

    public async listFiles(rootPath: string): Promise<IFileInfo[]> {

        const root = await this.getDirectory(rootPath);
        if (!root) return [];

        const files: IFileInfo[] = [];
        const dirs: [IDirectory, string][] = [[root, ""]];
        while (dirs.length) {
            const [dir, pathSoFar] = dirs.pop()!;
            files.push(...(await dir.getFiles()).map((file) => ({
                path: path.join(pathSoFar, file.filename).replaceAll("\\", "/"),
                modified: file.modified ?? 0,
                size: file.size ?? 0,
                permissions: file.permissions
            })));
            dirs.push(...(await dir.getSubDirs()).map((d) => ([
                d,
                path.join(pathSoFar, d.dirname)
            ] as [IDirectory, string])));
        }
        return files;
    }

    public async getDirectoryInfo(dirpath: string): Promise<IDirInfo | null> {
        const dir = await this.getDirectory(dirpath);
        if (!dir) return null;
        return {
            dirs: (await dir.getSubDirs()).map((subDir) => ({
                modified: subDir.modified,
                size: subDir.size,
                permissions: subDir.permissions,
                dirname: subDir.dirname
            })),
            files: (await dir.getFiles()).map((file) => ({
                filename: file.filename,
                size: file.size,
                permissions: file.permissions,
                modified: file.modified
            })),
            disk_usage: {
                free: 0,
                used: 0,
                total: 0
            },
            root_info: {
                name: dir.root.dirname,
                permissions: dir.root.permissions
            }
        };
    }

    public async uploadFile(root: string, filepath: string, filename: string, source: string): Promise<IFileChangeNotification> {

        const targetDir = path.join(root, filepath).replaceAll("\\", "/");
        await this.checkWriteProtected(targetDir);

        const destination = path.resolve(rootDir, root, filepath, filename);

        await fs.mkdirs(path.dirname(destination));
        await fs.copy(source, destination);
        await fs.remove(source);

        let size = 0;
        let modified = 0;
        try {
            const stat = await fs.stat(destination);
            size = stat.size;
            modified = stat.mtimeMs / 1000;
        } catch (_) {
            //
        }

        const notification: IFileChangeNotification = {
            action: "create_file",
            item: {
                path: path.join(filepath, filename).replaceAll("\\", "/"),
                root,
                size,
                modified,
                permissions: "rw"
            }
        };

        await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_filelist_changed", [notification]));
        return notification;
    }

    public async checkWriteProtected(dirpath: string): Promise<IDirectory | null> {

        const pathArr = dirpath.split("/").flatMap((s) => s.split("\\")).filter((s) => s);
        const root = this.directories.find((dir) => dir.dirname === pathArr[0]);
        let currentDir = root;
        if (!root) throw new Error("Root doesn't exist");
        pathArr.shift();

        while (currentDir) {
            if (!currentDir.permissions.includes("w")) {
                throw new Error("Write protected directory");
            }
            if (pathArr.length) {
                currentDir = await currentDir.getSubDir(pathArr.shift()!) ?? undefined;
            } else {
                break;
            }
        }

        return currentDir ?? null;
    }

    public async createDirectory(dirpath: string): Promise<IFileChangeNotification> {

        const dir = await this.checkWriteProtected(dirpath);

        const root = dirpath.split("/").filter((s) => s)[0];
        const diskPath = path.join(rootDir, dirpath);
        if (dir || await fs.pathExists(diskPath)) {
            throw new Error("Directory already exists");
        }

        await fs.mkdir(diskPath, { recursive: true });
        const notification: IFileChangeNotification = {
            item: {
                path: dirpath.split("/").filter((s) => s).slice(1).join("/"),
                root,
                permissions: "rw"
            },
            action: "create_dir"
        };
        await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_filelist_changed", [notification]));
        return { // why??? @arksine
            item: {
                path: dirpath,
                root,
                permissions: "rw"
            },
            action: "create_dir"
        };
    }

    public async deleteDirectory(dirpath: string, force: boolean): Promise<IFileChangeNotification> {

        const root = dirpath.split("/").filter((s) => s)[0];

        const diskPath = path.join(rootDir, dirpath);
        const stat = await fs.stat(diskPath);

        if (!stat.isDirectory()) throw new Error("Not a directory");

        const dir = await this.checkWriteProtected(dirpath);
        if (!dir) {
            throw new Error("Directory doesn't exist");
        }

        const files = await fs.readdir(diskPath);
        if (files.length && !force) {
            throw new Error("Directory contains files");
        }

        await fs.remove(diskPath);
        await marlinRaker.metadataManager.cleanup();
        const notification: IFileChangeNotification = {
            item: {
                path: dirpath.split("/").filter((s) => s).slice(1).join("/"),
                root,
                permissions: "rw",
                size: stat.size,
                modified: stat.mtimeMs / 1000
            },
            action: "delete_dir"
        };
        await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_filelist_changed", [notification]));
        return { // again, why??? @arksine
            item: {
                path: dirpath,
                root,
                permissions: "rw",
                size: stat.size,
                modified: stat.mtimeMs / 1000
            },
            action: "delete_dir"
        };
    }

    public async moveOrCopy(source: string, dest: string, copy: boolean): Promise<IFileChangeNotification> {
        await this.checkWriteProtected(source);
        await this.checkWriteProtected(dest);

        const sourceRoot = source.split("/").filter((s) => s)[0];
        const sourceOnDisk = path.join(rootDir, source);
        const destRoot = dest.split("/").filter((s) => s)[0];
        const destOnDisk = path.join(rootDir, dest);

        if (!await fs.pathExists(sourceOnDisk)) {
            throw new Error("Source doesn't exist");
        }

        await fs.mkdirs(path.dirname(destOnDisk));
        if (copy) {
            await fs.copy(sourceOnDisk, destOnDisk);
        } else {
            await fs.move(sourceOnDisk, destOnDisk);
            await marlinRaker.metadataManager.cleanup();
        }
        const stat = await fs.stat(destOnDisk);
        const action = stat.isFile() ? "move_file" : "move_dir";

        const notification: IFileChangeNotification = {
            item: {
                path: dest.split("/").filter((s) => s).splice(1).join("/"),
                root: destRoot,
                permissions: "rw",
                size: stat.size,
                modified: stat.mtimeMs / 1000
            },
            source_item: {
                path: source.split("/").filter((s) => s).splice(1).join("/"),
                root: sourceRoot
            },
            action
        };
        await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_filelist_changed", [notification]));

        return {
            item: {
                path: dest.split("/").filter((s) => s).splice(1).join("/"),
                root: destRoot,
                permissions: "rw",
                size: stat.size,
                modified: stat.mtimeMs / 1000
            },
            source_item: {
                path: source, // <-- ??
                root: sourceRoot
            },
            action
        };
    }

    public async deleteFile(filepath: string): Promise<IFileChangeNotification> {

        const root = filepath.split("/").filter((s) => s)[0];
        const diskPath = path.join(rootDir, filepath);
        const stat = await fs.stat(diskPath);
        if (!stat.isFile()) throw new Error("Not a file");

        await this.checkWriteProtected(path.dirname(filepath));
        await fs.remove(diskPath);

        const notification: IFileChangeNotification = {
            item: {
                path: filepath.split("/").filter((s) => s).splice(1).join("/"),
                root,
                permissions: "rw",
                size: stat.size,
                modified: stat.mtimeMs / 1000
            },
            action: "delete_file"
        };
        await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_filelist_changed", [notification]));
        return notification;
    }
}

export { IFileInfo, IDirInfo, IFileChangeNotification };
export default FileManager;