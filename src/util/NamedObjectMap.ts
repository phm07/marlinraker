interface INamedObject {
    name: string;
}

class NamedObjectMap<T extends INamedObject> implements Record<string, T | undefined> {

    [key: string]: T | undefined;

    public constructor(objects: (T | false)[]) {
        objects.filter((o): o is T => Boolean(o)).forEach((o) => this[o.name] = o);
    }
}

export default NamedObjectMap;