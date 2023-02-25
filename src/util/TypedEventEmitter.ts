import EventEmitter from "events";

type TEvents<E> = Record<keyof E, (...args: any[]) => void>;

declare interface TypedEventEmitter<E extends TEvents<E>> {
    addListener: <T extends keyof E>(eventName: T, listener: E[T]) => this;
    emit: <T extends keyof E>(eventName: T, ...args: Parameters<E[T]>) => boolean;
    eventNames: () => (keyof E)[];
    getMaxListeners: () => number;
    listenerCount: (eventName: keyof E) => number;
    listeners: <T extends keyof E>(eventName: T) => E[T][];
    off: <T extends keyof E>(eventName: T, listener: E[T]) => this;
    on: <T extends keyof E>(eventName: T, listener: E[T]) => this;
    once: <T extends keyof E>(eventName: T, listener: E[T]) => this;
    prependListener: <T extends keyof E>(eventName: T, listener: E[T]) => this;
    prependOnceListener: <T extends keyof E>(eventName: T, listener: E[T]) => this;
    rawListeners: (eventName: keyof E) => (...args: any[]) => any;
    removeAllListeners: (eventName?: keyof E) => this;
    removeListener: <T extends keyof E>(eventName: T, listener: E[T]) => this;
    setMaxListeners: (n: number) => this;
}

class TypedEventEmitter<E extends TEvents<E>> extends (EventEmitter as new() => {}) {}

export default TypedEventEmitter;