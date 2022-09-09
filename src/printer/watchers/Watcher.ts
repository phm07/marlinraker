
abstract class Watcher {

    private loaded: boolean;
    private readonly awaiters: (() => void)[];

    protected constructor() {
        this.loaded = false;
        this.awaiters = [];
    }

    public async waitForLoad(): Promise<void> {
        if (this.loaded) return;
        return new Promise<void>((resolve) => {
            this.awaiters.push(resolve);
        });
    }

    protected onLoaded(): void {
        this.loaded = true;
        this.awaiters.forEach((a) => a());
    }

    public abstract handle(line: string): boolean;

    public abstract delete(): void;
}

export default Watcher;