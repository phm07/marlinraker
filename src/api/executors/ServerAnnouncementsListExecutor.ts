import { IMethodExecutor, TSender } from "./IMethodExecutor";

interface IParams {
    include_dismissed: boolean;
}

interface IResult {
    entries: {
        entry_id: string;
        url: string;
        title: string;
        description: string;
        priority: "normal" | "high";
        date: number;
        dismissed: boolean;
        source: string;
        feed: string;
    }[];
    feeds: string[];
}

class ServerAnnouncementsListExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.announcements.list";

    public invoke(_: TSender, __: Partial<IParams>): IResult {
        // @TODO
        return {
            entries: [],
            feeds: []
        };
    }
}

export default ServerAnnouncementsListExecutor;