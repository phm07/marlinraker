import express, { Request, Response, Router, static as serveStatic } from "express";
import http from "http";
import MarlinRaker from "./MarlinRaker";
import { WebSocketServer } from "ws";
import Config from "./Config";
import path from "path";
import fs from "fs-extra";
import exampleConfig from "../example_config.json";
import { SerialPort } from "serialport";
import SerialPortSearch from "./util/SerialPortSearch";
import sourceMapSupport from "source-map-support";
import Logger, { Level } from "./logger/Logger";

sourceMapSupport.install({ handleUncaughtExceptions: false });

let marlinRaker: MarlinRaker;
let config: Config;
let rootDir: string;
let logger: Logger;
let router: Router;

(async (): Promise<void> => {

    // there is no logger available nor necessary at this point
    /* eslint-disable no-console */
    if (process.getuid?.() === 0) {
        console.error("Please do not run this program as root");
        process.exit(1);
    }

    if (process.argv.some((s) => s.toLowerCase() === "--find-ports")) {
        const ports = await SerialPort.list();
        console.log(`Possible ports: ${ports.map((port) => port.path).join(", ")}`);
        process.exit(0);
        return;
    }
    /* eslint-enable no-console */

    rootDir = path.resolve(process.env.MARLINRAKER_DIR ?? "../marlinraker_files/");
    await fs.mkdirs(rootDir);

    const logFile = path.join(rootDir, "logs/marlinraker.log");
    const isConsole = !process.argv.slice(1).find((s) => s.toLowerCase() === "--silent");
    const isLog = !process.argv.slice(1).find((s) => s.toLowerCase() === "--no-log");
    logger = new Logger(logFile, isConsole, isLog);

    process.on("uncaughtException", async (e) => {
        logger.error(e);
        await logger.shutdownGracefully();
        process.exit(0);
    });

    const configFile = path.join(rootDir, "config/marlinraker.json");
    await fs.mkdirs(path.dirname(configFile));
    if (!await fs.pathExists(configFile)) {
        const oldConfigPath = path.join(rootDir, "config/config.json");
        if (await fs.pathExists(oldConfigPath)) {
            await fs.move(oldConfigPath, configFile);
        } else {
            await fs.writeFile(configFile, JSON.stringify(exampleConfig, null, 2));
        }
    }
    config = new Config(configFile);

    const isDebug = config.getOrDefault<boolean>("extended_logs", false)
        || process.argv.some((s) => s.toLowerCase() === "--extended-logs");
    if (isDebug) {
        logger.level = Level.debug;
    }

    let port: string | null = config.getOrDefault("serial.port", "auto");
    let baudRate: number | null = Number.parseInt(config.getOrDefault("serial.baud_rate", "auto"));
    if (!port || port.toLowerCase() === "auto") {
        const serialPortSearch = new SerialPortSearch(baudRate);
        [port, baudRate] = await serialPortSearch.findSerialPort() ?? [null, null];
    }

    if (!port) {
        logger.error("Could not determine serial port to connect to.");
    } else {
        logger.info(`Using serial port ${port} with baud rate ${baudRate}`);
    }

    const app = express();

    if (isDebug) {
        app.use((req, _, next) => {
            logger.http(`${req.method} ${req.url} ${req.body ?? ""}`);
            next();
        });
    }

    router = express.Router();
    app.use(router);

    const wwwDir = path.join(rootDir, "www/");
    await fs.mkdirs(wwwDir);
    const isServeStatic = process.argv.some((s) => s.toLowerCase() === "--serve-static");
    if (isServeStatic) {
        app.use(serveStatic(wwwDir));
    }

    const logHandler = (_: Request, res: Response): void => {
        if (logger.isLog) {
            res.download(logger.logFile, path.basename(logger.logFile));
        } else {
            res.status(404).send();
        }
    };
    app.get("/server/files/klippy.log", logHandler);
    app.get("/server/files/moonraker.log", logHandler);
    app.get("/server/files/marlinraker.log", logHandler);

    app.get("*", (req, res) => {
        if (isServeStatic) {
            res.sendFile(path.join(rootDir, "www/index.html"));
        } else {
            res.status(404).send();
        }
    });

    const httpServer = http.createServer(app);
    const wss = new WebSocketServer({ server: httpServer, path: "/websocket" });

    const httpPort = config.getOrDefault("web.port", 7125);
    httpServer.listen(httpPort);
    logger.info(`App listening on port ${httpPort}`);

    marlinRaker = new MarlinRaker(wss, port, baudRate);
})().catch((e) => {
    throw e;
});

export { marlinRaker, config, rootDir, logger, router };