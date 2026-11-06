const RESTART_EXIT_CODE = 75;

function isRunningInContainer(env: NodeJS.ProcessEnv = process.env): boolean {
    return env.MARLINRAKER_CONTAINER === "true";
}

export { RESTART_EXIT_CODE, isRunningInContainer };
