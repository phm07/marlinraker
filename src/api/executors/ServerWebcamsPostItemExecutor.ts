import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";
import { IWebcam, TWebcamParams } from "../../webcams/WebcamManager";

interface IResult {
    webcam: IWebcam;
}

class ServerWebcamsPostItemExecutor implements IMethodExecutor<TWebcamParams, IResult> {

    public readonly name = "server.webcams.post_item";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<TWebcamParams>): Promise<IResult> {
        return { webcam: await this.marlinRaker.webcamManager.save(params) };
    }
}

export default ServerWebcamsPostItemExecutor;
