import PrinterObject from "./PrinterObject";
import { config } from "../../Server";

type TObject = {
    config: unknown,
    settings: unknown,
    save_config_pending: boolean
};

class ConfigFileObject extends PrinterObject<TObject> {

    public readonly name = "configfile";

    public constructor() {
        super();
    }

    public get(_: string[] | null): TObject {
        return {
            config: config.klipperPseudoConfig,
            settings: config.klipperPseudoConfig,
            save_config_pending: false
        };
    }
}

export default ConfigFileObject;