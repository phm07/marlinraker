abstract class Watcher {

    private resolveLoadingPromise!: () => void;
    private readonly loadingPromise: Promise<void>;

    protected constructor() {
        this.loadingPromise = new Promise((resolve) => {
            this.resolveLoadingPromise = resolve;
        });
    }

    public async waitForLoad(): Promise<void> {
        return this.loadingPromise;
    }

    protected onLoaded(): void {
        this.resolveLoadingPromise();
    }

    public abstract handle(line: string): boolean;

    public abstract cleanup(): void;
}

export default Watcher;