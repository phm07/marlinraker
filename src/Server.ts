import express, { Request, Response, Router, static as serveStatic } from "express";
import http from "http";
import MarlinRaker from "./MarlinRaker";
import { WebSocketServer } from "ws";
import Config from "./config/Config";
import path from "path";
import fs from "fs-extra";
import { SerialPort } from "serialport";
import sourceMapSupport from "source-map-support";
import Logger, { Level } from "./logger/Logger";
import cors from "cors";

sourceMapSupport.install({ handleUncaughtExceptions: false });

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

    const configFile = path.join(rootDir, "config/marlinraker.toml");
    await fs.mkdirs(path.dirname(configFile));
    if (!await fs.pathExists(configFile)) {
        const defaultConfig = process.env.NODE_ENV === "production"
            ? (await import("../config/marlinraker.toml")).default
            : await fs.readFile("config/marlinraker.toml");
        await fs.writeFile(configFile, defaultConfig);

        const printerConfigFile = path.join(rootDir, "config/printer.toml");
        if (!await fs.pathExists(printerConfigFile)) {
            const defaultPrinterConfig = process.env.NODE_ENV === "production"
                ? (await import("../config/printers/generic.toml")).default
                : await fs.readFile("config/printers/generic.toml");
            await fs.writeFile(printerConfigFile, defaultPrinterConfig);
        }
    }
    config = new Config(configFile);

    const isDebug = config.getBoolean("misc.extended_logs", false)
        || process.argv.some((s) => s.toLowerCase() === "--extended-logs");
    if (isDebug) {
        logger.level = Level.debug;
    }

    const app = express();

    const corsDomains = config.getStringArray("web.cors_domains", []);
    if (corsDomains.length) {
        app.use(cors({
            origin: corsDomains
        }));
    } else {
        app.use(cors());
        logger.warn("No CORS domains found. Disabling CORS.");
    }

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

    const sendApi404 = (_: unknown, res: Response): void => {
        res.status(404);
        res.type("json");
        res.send({
            error: {
                code: 404,
                message: "Not Found",
                traceback: ""
            }
        });
    };
    ["printer", "api", "access", "machine", "server"].forEach((api) => {
        app.get(`/${api}/*`, sendApi404);
        app.post(`/${api}/*`, sendApi404);
    });

    app.get("*", (req, res) => {
        if (isServeStatic) {
            res.sendFile(path.join(rootDir, "www/index.html"));
        } else {
            res.status(404).send();
        }
    });

    const httpServer = http.createServer(app);
    const wss = new WebSocketServer({ server: httpServer, path: "/websocket" });

    const httpPort = config.getNumber("web.port", 7125);
    httpServer.listen(httpPort);
    logger.info(`App listening on port ${httpPort}`);

    new MarlinRaker(wss);
})().catch((e) => {
    throw e;
});

export { config, rootDir, logger, router };