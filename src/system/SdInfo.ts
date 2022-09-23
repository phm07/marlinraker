import SystemInfo from "./SystemInfo";
import { Buffer } from "buffer";

interface ISdInfo {
    manufacturer_id: string;
    manufacturer: string;
    oem_id: string;
    product_name: string;
    product_revision: string;
    serial_number: string;
    manufacturer_date: string;
    capacity: string;
    total_bytes: number;
}

class SdInfo {

    private static readonly MANUFACTURERS: Record<string, string | undefined> = {
        "1b": "Samsung",
        "03": "Sandisk",
        "74": "PNY"
    };

    public static getSdInfo(): ISdInfo | {} {

        try {
            const cid = SystemInfo.read("/sys/block/mmcblk0/device/cid").trim().toLowerCase();
            const manufacturerId = cid.substring(0, 2);
            const manufacturer = SdInfo.MANUFACTURERS[manufacturerId] ?? "Unknown";
            const oemId = cid.substring(2, 6);
            const productName = Buffer.from(cid.substring(6, 16), "hex").toString("ascii");
            const productRevision = `${Number.parseInt(cid[16], 16)}.${Number.parseInt(cid[17], 16)}`;
            const serial = cid.substring(18, 26);
            const year = Number.parseInt(cid.substring(27, 29), 16) + 2000;
            const month = Number.parseInt(cid[29], 16);
            const manufacturerDate = `${month}/${year}`;

            let capacity = "Unknown", totalBytes = 0;

            const csd = Buffer.from(SystemInfo.read("/sys/block/mmcblk0/device/csd").trim().toLowerCase(), "hex");
            switch (csd[0] >> 6 & 0x3) {
            case 0: {
                const maxBlockLen = Math.pow(csd[5] & 0xf, 2);
                const cSize = (csd[6] & 0x3) << 10 | csd[7] << 2 | csd[8] >> 6 & 0x3;
                const cMultReg = (csd[9] & 0x3) << 1 | csd[10] >> 7;
                const cMult = Math.pow(cMultReg + 2, 2);
                totalBytes = (cSize + 1) * cMult * maxBlockLen;
                capacity = `${Math.round(totalBytes / Math.pow(1024, 2) * 10) / 10} MiB`;
                break;
            }
            case 1: {
                const cSize = (csd[7] & 0x3f) << 16 | csd[8] << 8 | csd[9];
                totalBytes = (cSize + 1) * 512 * 1024;
                capacity = `${Math.round(totalBytes / Math.pow(1024, 3) * 10) / 10} GiB`;
                break;
            }
            case 2: {
                const cSize = (csd[6] & 0xf) << 24 | csd[7] << 16 | csd[8] << 8 | csd[9];
                totalBytes = (cSize + 1) * 512 * 1024;
                capacity = `${Math.round(totalBytes / Math.pow(1024, 4) / 10)} TiB`;
            }
            }

            return {
                manufacturer_id: manufacturerId,
                manufacturer: manufacturer,
                oem_id: oemId,
                product_name: productName,
                product_revision: productRevision,
                serial_number: serial,
                manufacturer_date: manufacturerDate,
                capacity,
                total_bytes: totalBytes
            };
        } catch (_) {
            return {};
        }
    }
}

export { ISdInfo };
export default SdInfo;