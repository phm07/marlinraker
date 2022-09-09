import { Request, Response } from "express";
import { marlinRaker, router } from "../Server";
import FileHandler from "./http/FileHandler";

class OctoprintEmulator {

    public constructor() {
        router.get("/api/version", OctoprintEmulator.handleApiVersion.bind(this));
        router.get("/api/server", OctoprintEmulator.handleApiServer.bind(this));
        router.get("/api/login", OctoprintEmulator.handleApiLogin.bind(this));
        router.get("/api/settings", OctoprintEmulator.handleApiSettings.bind(this));
        router.get("/api/job", OctoprintEmulator.handleApiJob.bind(this));
        router.get("/api/printer", OctoprintEmulator.handleApiPrinter.bind(this));
        router.get("/api/printerprofiles", OctoprintEmulator.handleApiPrinterprofiles.bind(this));
        router.post("/api/printer/command", OctoprintEmulator.handleApiPrinterCommand.bind(this));
        FileHandler.handleUpload("/api/files/local");
    }

    private static handleApiVersion(_: Request, res: Response): void {
        res.send({
            server: "1.5.0",
            api: "0.1",
            text: "OctoPrint (Marlinraker)"
        });
    }

    private static handleApiServer(_: Request, res: Response): void {
        res.send({
            server: "1.5.0",
            safemode: "settings"
        });
    }

    private static handleApiLogin(_: Request, res: Response): void {
        res.send({
            _is_external_client: false,
            _login_mechanism: "apikey",
            name: "_api",
            active: true,
            user: true,
            admin: true,
            apikey: null,
            permissions: [],
            groups: ["admins", "users"]
        });
    }

    private static handleApiSettings(_: Request, res: Response): void {
        res.send({
            plugins: {
                UltimakerFormatPackage: {
                    align_inline_thumbnail: false,
                    inline_thumbnail: false,
                    inline_thumbnail_align_value: "left",
                    inline_thumbnail_scale_value: "50",
                    installed: true,
                    installed_version: "0.2.2",
                    scale_inline_thumbnail: false,
                    state_panel_thumbnail: true
                }
            },
            feature: {
                sdSupport: false,
                temperatureGraph: false
            },
            webcam: {
                flipH: false,
                flipV: false,
                rotate90: false,
                streamUrl: "/webcam/?action=stream",
                webcamEnabled: true
            }
        });
    }

    private static handleApiJob(_: Request, res: Response): void {
        res.send({
            job: {
                file: {
                    name: null
                },
                estimatedPrintTime: null,
                filament: {
                    length: null
                },
                user: null
            },
            progress: {
                completion: null,
                filepos: null,
                printTime: null,
                printTimeLeft: null,
                printTimeOrigin: null
            },
            state: "Offline"
        });
    }

    private static handleApiPrinter(_: Request, res: Response): void {
        res.send({
            temperature: {
                tool0: {
                    actual: 22.25,
                    offset: 0,
                    target: 0
                },
                bed: {
                    actual: 22.25,
                    offset: 0,
                    target: 0
                }
            },
            state: {
                text: "state",
                flags: {
                    operational: true,
                    paused: false,
                    printing: false,
                    cancelling: false,
                    pausing: false,
                    error: false,
                    ready: false,
                    closedOrError: false
                }
            }
        });
    }

    private static handleApiPrinterprofiles(_: Request, res: Response): void {
        res.send({
            profiles: {
                _default: {
                    id: "_default",
                    name: "Default",
                    color: "default",
                    model: "Default",
                    default: true,
                    current: true,
                    heatedBed: true,
                    heatedChamber: false
                }
            }
        });
    }

    private static handleApiPrinterCommand(req: Request, res: Response): void {
        const commands = (req.body?.commands as (string[] | undefined)) ?? [];
        commands.forEach(async (command) => {
            await marlinRaker.printer?.queueGcode(command);
        });
        res.send({});
    }

}

export default OctoprintEmulator;