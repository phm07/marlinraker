import Database from "../database/Database";
import { SerialPort } from "serialport";
import readline from "readline";
import { logger } from "../Server";

class SerialPortSearch {

    private readonly database: Database;
    private readonly baudRate: number;

    public constructor(baudRate: number) {
        this.database = new Database();
        this.baudRate = baudRate;
    }

    public async findSerialPort(): Promise<string | null> {
        logger.info("Searching for serial port");

        const last = await this.database.getItem("marlinraker", "serial.last_port");
        if (last && typeof last === "string") {
            logger.info(`Trying last used port ${last}`);
            if (await this.trySerialPort(last)) {
                logger.info("Success");
                return last;
            } else {
                logger.info("Cannot connect");
            }
        }
        await this.database.deleteItem("marlinraker", "serial.last_port");

        const paths = (await SerialPort.list()).map((port) => port.path);
        for (const path of paths) {
            if (path === last) continue;
            logger.info(`Trying ${path}`);

            let success = false;
            try {
                success = await this.trySerialPort(path);
            } catch (e) {
                logger.error(e);
            }

            if (success) {
                logger.info("Success");
                await this.database.addItem("marlinraker", "serial.last_port", path);
                return path;
            } else {
                logger.info("Cannot connect");
            }
        }

        return null;
    }

    private async trySerialPort(path: string): Promise<boolean> {

        const ignoreError = (): void => {
            //
        };

        const port = new SerialPort({ path, baudRate: this.baudRate, autoOpen: false }, ignoreError);
        const isOpen = await new Promise<boolean>((resolve) => {
            port.open((err) => {
                resolve(!err);
            });
        });

        if (!isOpen) {
            return false;
        }

        const lineReader = readline.createInterface(port);
        const result = await Promise.race([
            new Promise<boolean>((resolve) => {
                setTimeout(() => resolve(false), 2000);
            }),
            new Promise<boolean>((resolve) => {
                lineReader.on("line", (line) => {
                    if (line === "ok") {
                        resolve(true);
                    }
                });
                try {
                    port.write("M115\n", ignoreError);
                } catch (_) {
                    //
                }
            })
        ]);

        port.close(ignoreError);
        return result;
    }
}

export default SerialPortSearch;