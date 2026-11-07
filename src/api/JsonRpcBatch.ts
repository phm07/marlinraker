async function handleJsonRpcPayload<TResponse>(
    payload: unknown,
    handleRequest: (request: unknown) => Promise<TResponse>
): Promise<TResponse | TResponse[]> {
    if (!Array.isArray(payload)) {
        return handleRequest(payload);
    }
    if (!payload.length) {
        return handleRequest({});
    }
    return Promise.all(payload.map(handleRequest));
}

export { handleJsonRpcPayload };
