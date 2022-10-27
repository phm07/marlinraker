import fs from "fs-extra";
import CpuInfo, { ICpuInfo } from "./CpuInfo";
import SdInfo, { ISdInfo } from "./SdInfo";
import { IDistribution } from "./Distribution";
import Network, { TNetwork } from "./Network";
import Distribution from "./Distribution";
import ProcStats from "./ProcStats";
import MarlinRaker from "../MarlinRaker";
import ServiceManager from "./ServiceManager";

interface IMachineInfo {
    cpu_info: ICpuInfo;
    sd_info: ISdInfo | {};
    distribution: IDistribution;
    network: TNetwork;
}

class SystemInfo {

    public readonly machineInfo: IMachineInfo;
    public readonly procStats: ProcStats;
    public readonly serviceManager: ServiceManager;

    public constructor(marlinRaker: MarlinRaker) {
        this.machineInfo = SystemInfo.loadMachineInfo();
        this.procStats = new ProcStats(marlinRaker);
        this.serviceManager = new ServiceManager(marlinRaker);
    }

    private static loadMachineInfo(): IMachineInfo {
        return {
            cpu_info: CpuInfo.getCpuInfo(),
            sd_info: SdInfo.getSdInfo(),
            distribution: Distribution.getDistribution(),
            network: Network.getNetwork()
        };
    }

    public static read(path: string): string {
        const file = fs.openSync(path, "r", 0o666);
        const chunks = [];
        let pos = 0;
        for (;;) {
            const buf = Buffer.allocUnsafe(1024);
            const read = fs.readSync(file, buf, 0, buf.length, pos);
            pos += read;
            if (!read) break;
            chunks.push(buf.subarray(0, read));
        }
        return Buffer.concat(chunks).toString("utf-8");
    }
}

export { IMachineInfo };
export default SystemInfo;