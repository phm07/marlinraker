import { Socket } from "net";
import { base32 } from "rfc4648";
import * as crypto from "crypto";

class AccessManager {

    private readonly oneshotTokens: { client: Socket; time: number; token: string }[];

    public constructor() {
        this.oneshotTokens = [];
    }

    public generateOneshotToken(socket: Socket): string {
        let token = "";
        do {
            token = base32.stringify(crypto.webcrypto.getRandomValues(new Uint8Array(20)), { pad: false });
        } while (this.oneshotTokens.some((t) => t.token === token));
        this.oneshotTokens.push({
            client: socket,
            time: Date.now(),
            token
        });
        return token;
    }
}

export default AccessManager;