interface IUpdatable<TInfo> {
    readonly name: string;
    info?: TInfo;
    checkForUpdate: () => void;
    update: () => Promise<void>;
}

export { IUpdatable };