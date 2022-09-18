![](https://img.shields.io/github/v/tag/pauhull/marlinraker?label=release)
![](https://img.shields.io/github/last-commit/pauhull/marlinraker)
![](https://img.shields.io/github/license/pauhull/marlinraker)
![](https://img.shields.io/github/issues-raw/pauhull/marlinraker)
![](https://img.shields.io/tokei/lines/github/pauhull/marlinraker)
![](https://img.shields.io/github/downloads/pauhull/marlinraker/total)

## Overview
Marlinraker is a tool that connects an external device to your Marlin 3D Printer
via serial and emulates Moonraker API endpoints. This enables you to use
your favorite Klipper interfaces like Mainsail and Fluidd with Marlin
machines. The Node.js runtime makes it performant enough to easily run
on low-power SBCs like the Raspberry Pi Zero W and even on Windows machines.

## Installation
There is a pre-built image available for easy installation on common
Raspberry Pi SBCs. You can download it [here](https://github.com/pauhull/MarlinrakerOS/releases/latest). You can use the
[Raspberry Pi Imager](https://www.raspberrypi.com/software/) to flash
it onto your SD card.

## File structure
All Marlinraker-related files will be stored in a folder called ``marlinraker_files``.
It will be located next to the directory Marlinraker is running in. For example, on the
pre-built image Marlinraker is running in ``/pi/home/marlinraker``, so it will be located
at ``/pi/home/marlinraker_files``. It contains the following subdirectories and files:

#### ``config/``
This is where config files, most notably ``marlinraker.json``, are stored. This folder will be
exposed by the API and editable in your web interface of choice.

#### ``gcodes/``
User-uploaded Gcode files will be stored in this folder. It will too be exposed by the API.

#### ``logs/``
Logs are stored here. The most recent log file will always be called ``marlinraker.log``.
Log files will be rotated after they reach a size of 1 megabyte. If there are more than
5 files, old logs will be deleted.

#### ``update_scripts/``
Update scripts are located here. See [Update scripts](#update-scripts) for more info.

#### ``www/``
This is where the web interface will be located. The contents of this folder will be
statically served.

## Configuration
If you use the provided image the configuration file will be located under
``/home/pi/marlinraker_files/config/marlinraker.json``. This is what the config looks
like by default:

```json
{
  "web": {
    "port": 7125
  },
  "serial": {
    "port": "auto",
    "baud_rate": "auto",
    "max_connection_attempts": 5,
    "connection_timeout": 5000
  },
  "printer": {
    "bed_mesh": true,
    "print_volume": {
      "x": 180,
      "y": 180,
      "z": 180
    },
    "extruder": {
      "min_temp": 0,
      "max_temp": 250,
      "min_extrude_temp": 180
    },
    "heater_bed": {
      "min_temp": 0,
      "max_temp": 100
    }
  },
  "macros": {
    "pause": {
      "rename_existing": "pause_base",
      "gcode": [
        "pause_base",
        "G91",
        "G1 Z5 E-20 F600",
        "G90",
        "G1 X0 Y0 F6000"
      ]
    },
    "resume": {
      "rename_existing": "resume_base",
      "gcode": [
        "G91",
        "G1 Z-5 E20 F600",
        "resume_base"
      ]
    },
    "cancel_print": {
      "rename_existing": "cancel_base",
      "gcode": [
        "cancel_base",
        "G28 X Y",
        "M18",
        "M104 S0",
        "M140 S0",
        "M107"
      ]
    }
  },
  "display_messages": true,
  "sd_card": true,
  "octoprint_compat": true,
  "extended_logs": false
}
```

Below is a detailed overview of
configurable properties. If a property is not configured, the default will be used.
Machine-related properties won't actually change printer behavior and are
used for display only.

#### ``web.port: integer``
Port where API endpoints are served. Default is ``7125``.

#### ``serial.port: string``
Serial port of the printer to connect to. Set to ``""`` or ``"auto"`` for
automatic port scanning. Alternatively a port like ``"/dev/ttyUSB0"`` can be
specified. Default is ``"auto"``.

#### ``serial.baud_rate: number | "auto"``
Serial baud rate. Use ``"auto"`` to auto-detect baud rate or directly specify
it here. Default is ``"auto"``.

#### ``serial.max_connection_attempts: number``
Number of times Marlinraker tries to connect with your printer. This is useful
for machines which reset after a serial connection has been established and
need to boot first before taking any commands. Default is ``5``.

#### ``serial.connection_timeout: number``
How long a connection attempt can take before it is canceled in milliseconds.
Default is ``5000``.

#### ``printer.bed_mesh: boolean``
Specify if bed mesh leveling is enabled for this machine. Default is ``true``.

#### ``printer.print_volume.[x,y,z]: number``
Machine print volume. Default is ``180`` for all axes.

#### ``printer.extruder.min_temp: number``
Minimum extruder temperature. Default is ``0``.

#### ``printer.extruder.max_temp: number``
Maximum extruder temperature. Default is ``250``.

#### ``printer.extruder.min_extrude_temp: number``
Maximum temperature for extrusion. Default is ``180``.
Interfaces may prevent you from extruding material if this
temperature is not reached.

#### ``printer.heater_bed.min_temp: number``
Minimum bed temperature. Default is ``0``.

#### ``printer.heater_bed.max_temp: number``
Maximum bed temperature. Default is ``100``.

#### ``macros.{macro_name}.gcode: string[]``
Defines a macro with the name ``{macro_name}`` and sets the gcode that will be executed.

#### ``macros.{macro_name}.rename_existing: string``
If a macro with the name ``{macro_name}`` already exists, it will be renamed to this value.

#### ``display_messages: boolean``
Show ``M117`` messages. Default is ``true``.

#### ``sd_card: boolean``
Enable SD card if supported. This enables listing files on the SD card and starting SD prints.
Default is ``true``.

#### ``octoprint_compat: boolean``
Simulate OctoPrint API endpoints to allow Gcode upload from slicers. Default is ``true``.

#### ``extended_logs: boolean``
Enable verbose logging. Useful for debugging and development. Default is ``false``. Note:
This will create very large log files quickly and will impact print performance.

## Update scripts
Marlinraker will load all scripts contained in ``update_scripts/`` and use them for updating
components. Files starting with ``_`` are ignored. When called with ``-i`` as an argument,
scripts should print a component status information JSON object (see [Moonraker docs](https://moonraker.readthedocs.io/en/latest/web_api/#get-update-status)) 
to stdout. ``version`` and ``remote_version`` have to be included in order for updates to work.
When called with ``-u`` as an argument, the script should update the component. Pre-made scripts
for Marlinraker, Mainsail and Fluidd are included in the Raspberry Pi image.

## Command line arguments
- ``--find-ports`` List available serial ports and exit
- ``--silent`` No console output
- ``--no-log`` No file logging
- ``--extended-logs`` Include debugging information in console and logs
- ``--serve-static`` Serve ``www`` directory (useful for development)

## For client developers
To identify a Marlinraker instance, check the ``/server/info`` API endpoint. For regular
Moonraker installations ``type`` will not be defined. For Marlinraker it will always be
set to ``"marlinraker"``.

> **Warning**
> 
> Never leave your machine unattended. Do not make the API accessible from outside your local network. 
> This software is in early development, bugs are expected.