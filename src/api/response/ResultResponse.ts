import Response from "./Response";

class ResultResponse<TResult> extends Response {

    private readonly result: TResult;

    public constructor(result: TResult) {
        super();
        this.result = result;
    }
}

export default ResultResponse;