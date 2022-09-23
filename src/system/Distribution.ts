import SystemInfo from "./SystemInfo";
import os from "os";

interface IDistribution {
    name: string;
    id: string;
    version: string;
    version_parts: {
        major: string;
        minor: string;
        build_numer: string;
    };
    like: string;
    codename: string;
}

class Distribution {

    public static getDistribution(): IDistribution {

        let name = "Unknown", id = "", version = "", major = "", minor = "", buildNumber = "", like = "", codename = "";

        switch (os.platform()) {
        case "win32":
            name = "Windows";
            break;
        case "linux":
            name = "Linux";
            break;
        case "darwin":
            name = "MacOS";
            break;
        case "android":
            name = "Android";
            break;
        }

        try {
            const content = SystemInfo.read("/etc/os-release");
            const info: Record<string, string | undefined> = Object.fromEntries(content.split(/\r?\n/)
                .map((line) => /^(.*)="?(.*?)(?:"$|$)/.exec(line)?.slice(1))
                .filter((entry): entry is [string, string] => entry !== undefined && entry.length === 2));

            name = info.PRETTY_NAME ?? info.NAME ?? name;
            id = info.ID ?? id;
            version = info.VERSION_ID ?? version;
            [major, minor, buildNumber] = version.split(".").concat("", "", "");
            like = info.ID_LIKE ?? like;
            codename = info.VERSION_CODENAME ?? codename;
        } catch (_) {
            //
        }

        return {
            name,
            id,
            version,
            version_parts: {
                major,
                minor,
                build_numer: buildNumber
            },
            like,
            codename
        };
    }
}

export { IDistribution };
export default Distribution;