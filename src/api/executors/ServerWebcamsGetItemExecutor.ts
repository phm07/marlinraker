import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";
import { IWebcam, IWebcamQuery } from "../../webcams/WebcamManager";

interface IResult {
    webcam: IWebcam;
}

class ServerWebcamsGetItemExecutor implements IMethodExecutor<IWebcamQuery, IResult> {

    public readonly name = "server.webcams.get_item";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IWebcamQuery>): Promise<IResult> {
        const webcam = await this.marlinRaker.webcamManager.get(params);
        if (!webcam) throw new Error("Webcam not found");
        return { webcam };
    }
}

export default ServerWebcamsGetItemExecutor;
