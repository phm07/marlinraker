import PrintJob from "../printer/jobs/PrintJob";

interface IFile {
    filename: string;
    permissions: string;
    size?: number;
    modified?: number;
    getPrintJob?: () => PrintJob;
}

export { IFile };