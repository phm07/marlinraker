# Configuration

## File structure

All Marlinraker-related files will be stored in a folder called ``marlinraker_files``.
It will be located next to the directory Marlinraker is running in. For example, on the
pre-built image Marlinraker is running in ``/pi/home/marlinraker``, so it will be located
at ``/pi/home/marlinraker_files``. It contains the following subdirectories and files:

``config/``<br>
This is where config files are stored. This folder will be exposed by the API and contents will
be editable in your web interface of choice. See [Configuration reference](#configuration-reference) for more info.

``gcodes/``<br>
User-uploaded G-code files will be stored in this folder. It will too be exposed by the API.

``logs/``<br>
Logs are stored here. The most recent log file will always be called ``marlinraker.log``.
Log files will be rotated after they reach a size of 1 megabyte. If there are more than
5 files, old logs will be deleted.

``update_scripts/``<br>
Update scripts are located here. See [Update scripts](advanced/update_manager.md) for more info.

``www/``<br>
This is where the web interface will be located. The contents of this folder will be
statically served.

## Configuration reference

Marlinraker uses [TOML](https://toml.io/) as its format for configuration files. Marlinraker 
will always load the `marlinraker.toml` config file. From there on it is possible to
include other configuration files using the `include` directive:

```toml
#<include file/to/include.toml>
```

This can be used to efficiently organize configuration files and swap them out if needed.
That's why by default all printer-related settings are stored in `printer.toml` and
included in the main config file.

[Here](https://github.com/pauhull/marlinraker/tree/master/config/printers) you can find 
pre-made printer configuration files. If you find a configuration matching your printer
you can copy its contents into `printer.toml`.

### General settings

```toml
[web]
port = 7125
# The port Marlinraker will run on. Note that this is
# not necessarily the port your web interface will run on.

[serial]
port = "auto"
# Serial port to connect to. Use "auto" for auto-detecting
# any connected printer. Can alternatively be a USB port
# like "/dev/ttyUSB0" on Linux or "COM1" on Windows.
baud_rate = "auto"
# Baud rate to use for the USB connection. Use "auto" for
# auto-detection. Can alternatively be a integer value like
# 115200 or 250000.
max_connection_attempts = 5
# Number of connection attempts before connection is terminated.
# Can be useful for printers that reset after a connection
# has been opened and need some time to start up.
connection_timeout = 5000
# Time in ms after a connection times out if no response was
# detected.

[misc]
octoprint_compat = true
# Set to true to enable OctoPrint API emulation. This is useful
# if you want to upload G-code to your printer directly from
# your slicer.
extended_logs = false
# Output debug information to logs. Only recommended for developers
# and advanced users, can negatively impact performance.
m114_poll_rate = 0.2
# Interval between M114 queries in seconds. A short interval means
# more accurate speed estimations. On slower boards or unoptimized 
# firmwares this can lead to print stuttering. If you notice stuttering,
# try increasing this interval.
```

### Printer-specific settings
```toml
[printer]
bed_mesh = false
# Set to true if your printer has bed mesh leveling.
print_volume = [220, 220, 240]
# x, y and z print volume of your printer.

[printer.extruder]
min_temp = 0
# Extruder minimum temperature in C.
max_temp = 250
# Extruder maximum temperature in C. Note that this setting
# will not actually prevent your printer from exceeding
# this temperature!
min_extrude_temp = 180
# Minimum extrude temperature in C. As with min_temp and max_temp,
# this will not actually limit your machine.

[printer.heater_bed]
min_temp = 0
# See printer.extruder.min_temp
max_temp = 100
# See printer.extruder.max_temp

[printer.gcode]
send_m73 = true
# Whether to send M73 (Print progress) G-codes to your printer while
# printing. Note that some slicers already include M73 G-codes in sliced
# files. If you notice that the progress indicator is jumping between values,
# set this option to false.
```

### Macros

Marlinraker allows you to define macros. Macros allow you to extend your
printer's functionality with own G-code commands. A macro might look like
this:

```toml
[macros.example]
rename_existing = "example_base"
# Optional. If this macro overrides an already existing macro, this option
# can be used to rename it.
gcode = """
G28 ; Home printer
M118 E1 Hi mom!
"""
# The actual G-code that will be run when executing this macro. 
```

You likely want to redefine certain macros to better fit your printer. Macros
you can redefine include:

- `cancel_print`
- `pause`
- `resume`
- `sdcard_reset_file`
- `start_print`

Advanced users might want to have a look at [Macro scripting](advanced/macro_scripting.md).