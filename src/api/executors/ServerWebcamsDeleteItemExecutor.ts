import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";
import { IWebcam, IWebcamQuery } from "../../webcams/WebcamManager";

interface IResult {
    webcam: IWebcam;
}

class ServerWebcamsDeleteItemExecutor implements IMethodExecutor<IWebcamQuery, IResult> {

    public readonly name = "server.webcams.delete_item";
    public readonly httpMethod = "delete";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IWebcamQuery>): Promise<IResult> {
        return { webcam: await this.marlinRaker.webcamManager.delete(params) };
    }
}

export default ServerWebcamsDeleteItemExecutor;
