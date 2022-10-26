import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    uid: string;
    all: boolean;
}

type TResult = string[];

class ServerHistoryDeleteJobExecutor implements IMethodExecutor<IParams, TResult> {

    public readonly name = "server.history.delete_job";
    public readonly httpName = "server.history.job";
    public readonly httpMethod = "delete";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<TResult> {
        if (!params.uid && !params.all) throw new Error("No uid specified and not deleting all");
        return await this.marlinRaker.jobHistory.deleteJobs(params.uid ?? "", params.all ?? false);
    }
}

export default ServerHistoryDeleteJobExecutor;