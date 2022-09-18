import { IMethodExecutor, TSender } from "./IMethodExecutor";
import si from "systeminformation";

type TResult = {
    system_info: {
        cpu_count: number,
        bits: string,
        processor: string,
        cpu_desc: string,
        serial_number: string,
        hardware_desc: string,
        model: string,
        total_memory: number,
        memory_units: string
    }
};

class MachineSystemInfoExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "machine.system_info";
    public readonly timeout = 30000;

    public async invoke(_: TSender, __: undefined): Promise<TResult> {
        const cpuInfo = await si.cpu();
        const osInfo = await si.osInfo();
        const systemInfo = await si.system();
        const memoryInfo = await si.mem();
        return {
            system_info: {
                cpu_count: cpuInfo.cores,
                bits: osInfo.arch,
                processor: cpuInfo.brand,
                cpu_desc: `${cpuInfo.manufacturer} ${cpuInfo.brand}`,
                serial_number: "",
                hardware_desc: "",
                model: systemInfo.model,
                total_memory: memoryInfo.total / 1_000_000,
                memory_units: "MB"
            }
        };
    }
}

export default MachineSystemInfoExecutor;