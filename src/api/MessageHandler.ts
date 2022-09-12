import Response from "./response/Response";
import ErrorResponse from "./response/ErrorResponse";
import ResultResponse from "./response/ResultResponse";
import { IMethodExecutor, TSender } from "./executors/IMethodExecutor";
import { logger } from "../Server";

abstract class MessageHandler {
    protected async handleMessage(sender: TSender, executor: IMethodExecutor<unknown, unknown> | undefined, params: unknown): Promise<Response> {
        if (!executor) {
            return new ErrorResponse(404, "Method not found");
        }
        try {
            let timeout: NodeJS.Timer | undefined;
            return await Promise.race<Response>([
                new Promise((resolve) => {
                    Promise.resolve(executor.invoke(sender, params as Partial<unknown>)).then((response) => {
                        clearTimeout(timeout);
                        if (response === null) {
                            logger.error(`Error in ${executor.name}: Null response`);
                            resolve(new ErrorResponse(500, "Method error"));
                        }
                        resolve(new ResultResponse<typeof response>(response));
                    });
                }),
                new Promise((resolve) => {
                    if (executor.timeout === null) return;
                    const ms = executor.timeout ?? 10000;
                    timeout = setTimeout(() => {
                        logger.error(`${executor.name} timed out after ${ms / 1000}s`);
                        resolve(new ErrorResponse(408, "Request timeout"));
                    }, ms);
                })
            ]);
        } catch (e: unknown) {
            logger.error(`Error in ${executor.name}: ${e}`);
            return new ErrorResponse(500, "Method error: " + e);
        }
    }
}

export default MessageHandler;