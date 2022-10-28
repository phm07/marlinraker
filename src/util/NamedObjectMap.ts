interface INamedObject {
    name: string;
}

class NamedObjectMap<T extends INamedObject> extends Map<T["name"], T> {

    public constructor(objects: T[] = []) {
        super();
        objects.forEach((o) => this.set(o.name, o));
    }

    public add(object: T): this {
        this.set(object.name, object);
        return this;
    }

    public remove(object: T): boolean {
        return this.delete(object.name);
    }
}

export default NamedObjectMap;