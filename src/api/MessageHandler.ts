import Response from "./response/Response";
import ErrorResponse from "./response/ErrorResponse";
import ResultResponse from "./response/ResultResponse";
import { IMethodExecutor, TSender } from "./executors/IMethodExecutor";

abstract class MessageHandler {
    protected async handleMessage(sender: TSender, executor: IMethodExecutor<unknown, unknown> | undefined, params: unknown): Promise<Response | string> {
        if (!executor) {
            return new ErrorResponse(404, "Method not found");
        }
        try {
            const response = await Promise.resolve(executor.invoke(sender, params as Partial<unknown>));
            if (response === null) {
                return new ErrorResponse(500, "Method error");
            }
            return new ResultResponse<typeof response>(response);
        } catch (e: unknown) {
            return new ErrorResponse(500, "Method error: " + e);
        }
    }
}

export default MessageHandler;