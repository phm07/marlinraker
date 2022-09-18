import { IFile } from "./IFile";

interface IDirectory {
    dirname: string;
    permissions: string;
    size?: number;
    modified?: number;
    root: IDirectory;

    getSubDirs(): Promise<IDirectory[]>;

    getSubDir(name: string): Promise<IDirectory | null>;

    getFiles(): Promise<IFile[]>;

    getFile(name: string): Promise<IFile | null>;
}

export { IDirectory };