# CLI Arguments

## List of CLI arguments

CLI arguments are mostly supposed for use in development.

- `--find-ports`<br>
List available serial ports and exit
- `--silent`<br>
Do not print log to console
- `--no-log`<br>
Do not log output to files (`marlinraker_files/logs/marlinraker.txt`)
- `--extended-logs`<br>
Include debugging information in console and logs (See `extended_logs`
option in [Configuration](/configuration))
- `--serve-static`<br>
Serve `marlinraker_files/www` directory with express

You can pass CLI arguments to the program like follows:

`npm run start -- --silent --no-log [...]`