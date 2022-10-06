import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import path from "path";
import { rootDir } from "../Server";

class Database {

    private readonly reservedNamespaces = ["marlinraker", "moonraker", "gcode_metadata", "history"];
    private readonly jsonDb;

    public constructor() {
        this.jsonDb = new JsonDB(new Config(path.join(rootDir, "database.json"), true, true, "."));
    }

    public async getNamespaces(): Promise<string[]> {
        const root = await this.jsonDb.getData(".");
        return [...this.reservedNamespaces, ...Object.keys(root)];
    }

    private static getPath(namespace: string, key?: string): string {
        return `.${namespace}${key ? `.${key}` : ""}`;
    }

    public async getItem(namespace: string, key?: string): Promise<unknown | null> {
        try {
            return await this.jsonDb.getData(Database.getPath(namespace, key));
        } catch (e) {
            return null;
        }
    }

    public async addItem(namespace: string, key: string | undefined, value: unknown): Promise<unknown> {
        await this.jsonDb.push(Database.getPath(namespace, key), value, true);
        return value;
    }

    public async deleteItem(namespace: string, key: string): Promise<unknown | null> {
        const value = this.getItem(namespace, key);
        try {
            await this.jsonDb.delete(Database.getPath(namespace, key));
        } catch (e) {
            return null;
        }
        return value;
    }
}

export default Database;