import Response from "./Response";

class ErrorResponse extends Response {

    private readonly error: { code: number; message: string };

    public constructor(code: number, message: string) {
        super();
        this.error = { code, message };
    }
}

export default ErrorResponse;