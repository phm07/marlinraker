interface IQueuedJob {
    filename: string;
    jobId: string;
    timeAdded: number;
    timeInQueue: number;
}

export { IQueuedJob };