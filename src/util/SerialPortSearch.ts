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

    public async findSerialPort(): Promise<[string, number] | null> {
        logger.info("Searching for serial port");

        const lastPort = await this.database.getItem("marlinraker", "serial.last_port");
        const lastBaudRate = this.baudRate || await this.database.getItem("marlinraker", "serial.last_baud_rate");
        if (lastPort && lastBaudRate && typeof lastPort === "string" && typeof lastBaudRate === "number") {
            logger.info(`Trying last used port ${lastPort} with baud rate ${lastBaudRate}`);
            if (await this.trySerialPort(lastPort, lastBaudRate)) {
                logger.info("Success");
                return [lastPort, lastBaudRate];
            } else {
                logger.info("Cannot connect. Searching for port...");
            }
        }

        await this.database.deleteItem("marlinraker", "serial.last_port");
        await this.database.deleteItem("marlinraker", "serial.last_baud_rate");

        const paths = (await SerialPort.list()).map((port) => port.path);
        const baudRates = this.baudRate ? [this.baudRate] : [250000, 115200, 19200];
        for (const path of paths) {
            for (const baudRate of baudRates) {
                logger.info(`Trying ${path} with baud rate ${baudRate}`);

                let success = false;
                try {
                    success = await this.trySerialPort(path, baudRate);
                } catch (e) {
                    logger.error(e);
                }

                if (success) {
                    logger.info("Success");
                    await this.database.addItem("marlinraker", "serial.last_port", path);
                    await this.database.addItem("marlinraker", "serial.last_baud_rate", baudRate);
                    return [path, baudRate];
                } else {
                    logger.info("Cannot connect");
                }
            }
        }

        return null;
    }

    private async trySerialPort(path: string, baudRate: number): Promise<boolean> {

        const ignoreError = (): void => {
            //
        };

        const port = new SerialPort({ path, baudRate, autoOpen: false }, ignoreError);
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
                    port.write("M110 N0\n", ignoreError);
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