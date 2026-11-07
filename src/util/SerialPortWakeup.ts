import { SerialPort } from "serialport";

type TEmit = (event: string | symbol, ...args: unknown[]) => boolean;

interface IPollingBinding {
    poller?: { emit: TEmit };
}

// @serialport/bindings-cpp emits poller events from a native libuv callback that, on Node.js 26,
// does not run queued promise jobs: the read waiting for "readable" only resumed when an unrelated
// timer fired, up to 250 ms later. Scheduling an immediate makes Node run them right away.
function wakeEventLoopOnSerialEvents(serialPort: SerialPort): void {
    const poller = (serialPort.port as IPollingBinding | undefined)?.poller;
    if (!poller) return;
    const emit = poller.emit.bind(poller);
    poller.emit = (event, ...args): boolean => {
        const handled = emit(event, ...args);
        setImmediate(() => undefined);
        return handled;
    };
}

export { wakeEventLoopOnSerialEvents };
