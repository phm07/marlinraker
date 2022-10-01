import PrinterObject from "./PrinterObject";
import { config } from "../../Server";
import Utils from "../../util/Utils";

interface IObject {
    config: unknown;
    settings: unknown;
    save_config_pending: boolean;
}

class ConfigFileObject extends PrinterObject<IObject> {

    public readonly name = "configfile";

    public constructor() {
        super();
    }

    public get(_: string[] | null): IObject {
        return {
            config: config.klipperPseudoConfig,
            settings: Utils.toLowerCaseKeys(config.klipperPseudoConfig),
            save_config_pending: false
        };
    }
}

export default ConfigFileObject;