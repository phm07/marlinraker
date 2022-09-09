import { IDirectory } from "./IDirectory";
import { IFile } from "./IFile";
import { marlinRaker } from "../Server";
import ParserUtil, { TFileInfo } from "../printer/ParserUtil";

class SDCardDirectory implements IDirectory {

    public readonly root: IDirectory;
    public readonly dirname: string;
    public readonly permissions: string;
    private lastFileList?: IFile[];

    public constructor(root: IDirectory | null, dirname: string) {
        this.root = root ?? this;
        this.dirname = dirname;
        this.permissions = "r";
    }

    public async getFiles(): Promise<IFile[]> {
        const response = await marlinRaker.printer?.queueGcode("M20", false, false);
        if (!response) return [];
        const fileList = ParserUtil.parseM20Response(response);

        this.lastFileList = Object.values(fileList).filter((file): file is TFileInfo => Boolean(file)).map((file) => ({
            filename: file.fullName ?? file.filename,
            size: file.size,
            permissions: "r"
            // getPrintJob: () => new SDCardPrintJob(file.filename)
        }));
        return this.lastFileList;
    }

    public async getFile(name: string): Promise<IFile | null> {
        if (!this.lastFileList) await this.getFiles();
        return this.lastFileList?.find((file) => file.filename === name) ?? null;
    }

    public async getSubDir(_: string): Promise<IDirectory | null> {
        return null;
    }

    public async getSubDirs(): Promise<IDirectory[]> {
        return [];
    }
}

export default SDCardDirectory;