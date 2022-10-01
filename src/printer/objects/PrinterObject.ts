import assert from "assert";

abstract class PrinterObject<TResponse> {

    public abstract readonly name: string;
    protected subscribers: { subscriber: () => void; previous: Partial<TResponse> }[];

    protected constructor() {
        this.subscribers = [];
    }

    public getFull(subscriber: () => void, topics: string[] | null): TResponse {
        const response = this.get(topics);
        const subscriberObject = this.subscribers.find((s) => s.subscriber === subscriber);
        if (subscriberObject) {
            subscriberObject.previous = response;
        }
        return response;
    }

    public getDifference(subscriber: () => void, topics: string[] | null): Partial<TResponse> {
        const subscriberObject = this.subscribers.find((s) => s.subscriber === subscriber);
        const previous: Partial<TResponse> = subscriberObject?.previous ?? {};
        const now = Object.freeze(this.get(topics));
        const diff: Partial<TResponse> = {};
        for (const key in now) {
            try {
                assert.deepEqual(previous[key], now[key]);
            } catch (_) {
                diff[key] = now[key];
            }
        }
        if (subscriberObject && Object.keys(diff).length) {
            subscriberObject.previous = now;
        }
        return diff;
    }

    protected abstract get(topics: string[] | null): TResponse;

    public emit(): void {
        this.subscribers.forEach((s) => s.subscriber());
    }

    public subscribe(subscriber: () => void): void {
        this.subscribers.push({ subscriber, previous: {} });
    }

    public unsubscribe(subscriber: () => void): void {
        this.subscribers = this.subscribers.filter((s) => s.subscriber !== subscriber);
    }
}

export default PrinterObject;