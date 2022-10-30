import PrinterObject from "./PrinterObject";
import { config } from "../../Server";
import Utils from "../../util/Utils";
import MarlinRaker from "../../MarlinRaker";

interface IObject {
    config: unknown;
    settings: unknown;
    save_config_pending: boolean;
}

class ConfigFileObject extends PrinterObject<IObject> {

    public readonly name = "configfile";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;

        this.marlinRaker.on("stateChange", this.emit.bind(this));
    }

    protected get(): IObject {
        let klipperPseudoConfig = { ...config.klipperPseudoConfig };

        if (this.marlinRaker.printer) {
            const limits = this.marlinRaker.printer.limits;
            klipperPseudoConfig = {
                ...klipperPseudoConfig,
                printer: {
                    kinematics: "cartesian",
                    max_velocity: Math.min(limits.maxFeedrate[0], limits.maxFeedrate[1]),
                    max_accel: Math.min(limits.maxAccel[1], limits.maxAccel[1]),
                    max_z_velocity: limits.maxFeedrate[2],
                    max_z_accel: limits.maxAccel[2]
                }
            };
        }

        return {
            config: klipperPseudoConfig,
            settings: Utils.toLowerCaseKeys(klipperPseudoConfig),
            save_config_pending: false
        };
    }
}

export default ConfigFileObject;