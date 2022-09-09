interface IMacro {
    readonly name: string;
    execute: (params: Record<string, string>) => Promise<void>;
}

export { IMacro };