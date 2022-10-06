import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

interface IParams {
    uid: string;
    all: boolean;
}

type TResult = string[];

class ServerHistoryDeleteJobExecutor implements IMethodExecutor<IParams, TResult> {

    public readonly name = "server.history.delete_job";
    public readonly httpName = "server.history.job";
    public readonly httpMethod = "delete";

    public async invoke(_: TSender, params: Partial<IParams>): Promise<TResult> {
        if (!params.uid && !params.all) throw new Error("No uid specified and not deleting all");
        return await marlinRaker.jobHistory.deleteJobs(params.uid ?? "", params.all ?? false);
    }
}

export default ServerHistoryDeleteJobExecutor;