import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleJsonRpcPayload } from "../../src/api/JsonRpcBatch";

const echo = async (request: unknown): Promise<unknown> => ({ answered: request });

describe("handleJsonRpcPayload", () => {
    it("answers a single request with a single response", async () => {
        assert.deepEqual(await handleJsonRpcPayload({ id: 1 }, echo), { answered: { id: 1 } });
    });

    it("answers a batch with the responses in request order", async () => {
        const slowFirst = async (request: unknown): Promise<unknown> => {
            const { id } = request as { id: number };
            await new Promise((resolve) => setTimeout(resolve, id === 1 ? 20 : 0));
            return id;
        };
        assert.deepEqual(await handleJsonRpcPayload([{ id: 1 }, { id: 2 }, { id: 3 }], slowFirst), [1, 2, 3]);
    });

    it("treats an empty batch as one invalid request", async () => {
        assert.deepEqual(await handleJsonRpcPayload([], echo), { answered: {} });
    });
});
