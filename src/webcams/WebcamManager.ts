import crypto from "crypto";

interface IWebcam {
    name: string;
    location: string;
    service: string;
    enabled: boolean;
    icon: string;
    target_fps: number;
    target_fps_idle: number;
    stream_url: string;
    snapshot_url: string;
    flip_horizontal: boolean;
    flip_vertical: boolean;
    rotation: number;
    aspect_ratio: string;
    extra_data: Record<string, unknown>;
    source: "database";
    uid: string;
}

type TWebcamParams = Partial<Record<keyof IWebcam, unknown>>;

interface IWebcamQuery {
    uid?: unknown;
    name?: unknown;
}

interface IWebcamStore {
    getItem: (namespace: string, key?: string) => Promise<unknown>;
    addItem: (namespace: string, key: string, value: unknown) => Promise<unknown>;
    deleteItem: (namespace: string, key: string) => Promise<unknown>;
}

const NAMESPACE = "webcams";

const DEFAULTS: Omit<IWebcam, "name" | "uid"> = {
    location: "printer",
    service: "mjpegstreamer",
    enabled: true,
    icon: "mdiWebcam",
    target_fps: 15,
    target_fps_idle: 5,
    stream_url: "",
    snapshot_url: "",
    flip_horizontal: false,
    flip_vertical: false,
    rotation: 0,
    aspect_ratio: "4:3",
    extra_data: {},
    source: "database"
};

function toBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
}

function toNumber(value: unknown, fallback: number): number {
    const number = typeof value === "string" ? Number(value) : value;
    return typeof number === "number" && Number.isFinite(number) ? number : fallback;
}

function toText(value: unknown, fallback: string): string {
    return typeof value === "string" ? value : fallback;
}

function toObject(value: unknown, fallback: Record<string, unknown>): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? value as Record<string, unknown>
        : fallback;
}

function mergeWebcam(base: IWebcam, params: TWebcamParams): IWebcam {
    return {
        name: toText(params.name, base.name),
        location: toText(params.location, base.location),
        service: toText(params.service, base.service),
        enabled: toBoolean(params.enabled, base.enabled),
        icon: toText(params.icon, base.icon),
        target_fps: toNumber(params.target_fps, base.target_fps),
        target_fps_idle: toNumber(params.target_fps_idle, base.target_fps_idle),
        stream_url: toText(params.stream_url, base.stream_url),
        snapshot_url: toText(params.snapshot_url, base.snapshot_url),
        flip_horizontal: toBoolean(params.flip_horizontal, base.flip_horizontal),
        flip_vertical: toBoolean(params.flip_vertical, base.flip_vertical),
        rotation: toNumber(params.rotation, base.rotation),
        aspect_ratio: toText(params.aspect_ratio, base.aspect_ratio),
        extra_data: toObject(params.extra_data, base.extra_data),
        source: "database",
        uid: base.uid
    };
}

class WebcamManager {

    private readonly store: IWebcamStore;
    private readonly onChange: (webcams: IWebcam[]) => Promise<void>;

    public constructor(store: IWebcamStore, onChange: (webcams: IWebcam[]) => Promise<void>) {
        this.store = store;
        this.onChange = onChange;
    }

    public async list(): Promise<IWebcam[]> {
        const saved = await this.store.getItem(NAMESPACE);
        return Object.values(toObject(saved, {})) as IWebcam[];
    }

    public async get(query: IWebcamQuery): Promise<IWebcam | null> {
        const webcams = await this.list();
        return webcams.find((webcam) => webcam.uid === query.uid)
            ?? webcams.find((webcam) => webcam.name === query.name)
            ?? null;
    }

    public async save(params: TWebcamParams): Promise<IWebcam> {
        const existing = await this.get({ uid: params.uid, name: params.name });
        const base = existing ?? { ...DEFAULTS, name: "", uid: crypto.randomUUID() };
        const webcam = mergeWebcam(base, params);
        if (!webcam.name) {
            throw new Error("A webcam name is required");
        }
        await this.store.addItem(NAMESPACE, webcam.uid, webcam);
        await this.onChange(await this.list());
        return webcam;
    }

    public async delete(query: IWebcamQuery): Promise<IWebcam> {
        const webcam = await this.get(query);
        if (!webcam) {
            throw new Error("Webcam not found");
        }
        await this.store.deleteItem(NAMESPACE, webcam.uid);
        await this.onChange(await this.list());
        return webcam;
    }
}

export { IWebcam, IWebcamQuery, IWebcamStore, TWebcamParams };
export default WebcamManager;
