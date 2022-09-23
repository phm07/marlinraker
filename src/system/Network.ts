import os from "os";

type TNetwork = Record<string, {
    mac_address: string;
    ip_addresses: {
        family: string;
        address: string;
        is_link_local: boolean;
    }[];
}>;

class Network {

    public static getNetwork(): TNetwork {

        const network: TNetwork = {};

        try {
            const interfaces = os.networkInterfaces();

            for (const ifaceName in interfaces) {
                const iface = interfaces[ifaceName]!;
                network[ifaceName] = {
                    mac_address: iface[0].mac,
                    ip_addresses: iface.map((address) => ({
                        family: address.family.toLowerCase(),
                        address: address.address,
                        is_link_local: address.scopeid === 0x2
                    }))
                };
            }
        } catch (_) {
            //
        }

        return network;
    }
}

export { TNetwork };
export default Network;