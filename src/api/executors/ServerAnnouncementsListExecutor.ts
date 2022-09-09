import { IMethodExecutor, TSender } from "./IMethodExecutor";

type TParams = { include_dismissed: boolean };

type TResult = {
    entries: {
        entry_id: string,
        url: string,
        title: string,
        description: string,
        priority: "normal" | "high",
        date: number,
        dismissed: boolean,
        source: string,
        feed: string
    }[],
    feeds: string[]
};

class ServerAnnouncementsListExecutor implements IMethodExecutor<TParams, TResult> {

    public readonly name = "server.announcements.list";

    public invoke(_: TSender, __: Partial<TParams>): TResult {
        // @TODO
        return {
            entries: [],
            feeds: []
        };
    }
}

export default ServerAnnouncementsListExecutor;