import EventEmitter from "events";

type TEvents<E> = Record<keyof E, (...args: any[]) => void>;

declare interface TypedEventEmitter<E extends TEvents<E>> {
    on: <T extends keyof E>(event: T, listener: E[T]) => this;
    emit: <T extends keyof E>(event: T, ...args: Parameters<E[T]>) => boolean;
}

// eslint-disable-next-line @typescript-eslint/no-extra-parens
class TypedEventEmitter<E extends TEvents<E>> extends (EventEmitter as any) {}

export default TypedEventEmitter;