import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";
import { IWebcam } from "../../webcams/WebcamManager";

interface IResult {
    webcams: IWebcam[];
}

class ServerWebcamsListExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.webcams.list";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: undefined): Promise<IResult> {
        return { webcams: await this.marlinRaker.webcamManager.list() };
    }
}

export default ServerWebcamsListExecutor;
