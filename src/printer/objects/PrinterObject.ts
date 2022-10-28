import assert from "assert";

interface ISubscriber<T> {
    subscriber: () => void;
    previous: Partial<T>;
}

abstract class PrinterObject<TResponse> {

    public abstract readonly name: string;
    protected subscribers: ISubscriber<TResponse>[];

    protected constructor() {
        this.subscribers = [];
    }

    public getFull(subscriber: () => void, topics: string[] | null): Partial<TResponse> {
        const response = this.query(topics);
        const subscriberObject = this.subscribers.find((s) => s.subscriber === subscriber);
        if (subscriberObject) {
            subscriberObject.previous = response;
        }
        return response;
    }

    public getDifference(subscriber: () => void, topics: string[] | null): Partial<TResponse> {
        const subscriberObject = this.subscribers.find((s) => s.subscriber === subscriber);
        const previous: Partial<TResponse> = subscriberObject?.previous ?? {};
        const now = Object.freeze(this.query(topics));
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

    public query(topics: string[] | null): Partial<TResponse> {
        const response = this.get();
        let withTopics: Partial<TResponse> = {};
        if (topics) {
            topics.forEach((topic) => withTopics[topic as keyof TResponse] = response[topic as keyof TResponse]);
        } else {
            withTopics = response;
        }
        return withTopics;
    }

    protected abstract get(): TResponse;

    public emit(): void {
        this.subscribers.forEach((s) => s.subscriber());
    }

    public subscribe(subscriber: () => void): void {
        this.subscribers.push({ subscriber, previous: {} });
    }

    public unsubscribe(subscriber: () => void): void {
        this.subscribers = this.subscribers.filter((s) => s.subscriber !== subscriber);
    }

    public isAvailable(): boolean {
        return true;
    }
}

export default PrinterObject;