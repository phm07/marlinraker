import Response from "./response/Response";
import ErrorResponse from "./response/ErrorResponse";
import ResultResponse from "./response/ResultResponse";
import { IMethodExecutor, TSender } from "./executors/IMethodExecutor";
import { logger } from "../Server";

abstract class MessageHandler {

    protected async handleMessage(sender: TSender, executor: IMethodExecutor<unknown, unknown> | undefined, params: unknown | undefined): Promise<Response> {
        if (!executor) {
            return new ErrorResponse(404, "Method not found");
        }
        let timeout: NodeJS.Timer | undefined;
        return await Promise.race<Response>([

            new Promise((resolve) => {
                if (executor.timeout === null) return;
                const ms = executor.timeout ?? 10000;
                timeout = setTimeout(() => {
                    logger.error(`${executor.name} timed out after ${ms / 1000}s`);
                    resolve(new ErrorResponse(408, "Request timeout"));
                }, ms);
            }),

            new Promise((resolve) => {
                const handleError = (e: unknown): void => {
                    clearTimeout(timeout);
                    const code = (e as { code?: number }).code ?? 500;
                    const message = (e as { message?: string }).message ?? e?.toString();
                    logger.error(`Error in ${executor.name}: ${message}`);
                    resolve(new ErrorResponse(code, `Method error: ${e}`));
                };

                try {
                    Promise.resolve(executor.invoke(sender, (params ?? {}) as Partial<unknown>)).then((response) => {
                        clearTimeout(timeout);
                        if (response === null) {
                            logger.error(`Error in ${executor.name}: No response`);
                            resolve(new ErrorResponse(500, "No response"));
                        }
                        resolve(new ResultResponse<typeof response>(response));
                    }).catch(handleError);
                } catch (e) {
                    handleError(e);
                }
            })
        ]);
    }
}

export default MessageHandler;