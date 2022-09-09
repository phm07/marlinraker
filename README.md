## Overview
Marlinraker is a tool that connects an external device to your Marlin 3D Printer
via serial and emulates Moonraker API endpoints. This enables you to use
your favorite Klipper interfaces like Mainsail and Fluidd with Marlin
machines. The Node.js runtime makes it performant enough to easily run
on low-power SBCs like the Raspberry Pi Zero W and even on Windows machines.

## Installation
There is a pre-built image available for easy installation on common
Raspberry Pi SBCs. You can download it [here](https://www.youtube.com/watch?v=gDjMZvYWUdo). You can use the
[Raspberry Pi Imager](https://www.raspberrypi.com/software/) to flash
it onto your SD card.

## File structure
All Marlinraker-related files will be stored in a folder called ``marlinraker_files``.
It will be located next to the directory Marlinraker is running in. For example, on the
pre-built image Marlinraker is running in ``/pi/home/marlinraker``, so it will be located
at ``/pi/home/marlinraker_files``. It contains the following subdirectories and files:

#### ``config/``
This is where config files, most notably ``config.json``, are stored. This folder will be
exposed by the API and editable in your web interface of choice.

#### ``gcodes/``
User-uploaded Gcode files will be stored in this folder. It will too be exposed by the API.

#### ``logs/``
Logs are stored here. The most recent log file will always be called ``marlinraker.log``.
Log files will be rotated after they reach a size of 1 megabyte. If there are more than
5 files, old logs will be deleted.

#### ``www/``
This is where the web interface will be located. The contents of this folder will be
statically served.

## Configuration
If you use the provided image the configuration file will be located under
``/home/pi/marlinraker_files/config/config.json``. This is what the config looks
like by default:

```json
{
  "web": {
    "port": 7125
  },
  "serial": {
    "port": "auto",
    "baud_rate": 250000
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
  "update_manager": {
    "marlinraker_repo": "pauhull/marlinraker",
    "client_repo": "mainsail-crew/mainsail"
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

#### ``serial.baud_rate: number``
Serial baud rate. Default is ``250000``.

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

#### ``update_manager.marlinraker_repo: string``
This is the repository where Marlinraker will look for updates. Repository format
is ``owner/repository``. Default is ``"pauhull/marlinraker"``.

#### ``update_manager.client_repo: string``
GitHub repository that contains the web interface to be served in the ``www``
directory in the format ``owner/repository``. Default is ``"mainsail-crew/mainsail"``.
It will download automatically on first startup so that the machine is accessible
without any further configuration. After that Marlinraker will periodically look for
updates and display them in the update manager. For Fluidd set this option to
``"fluidd-core/fluidd"`` and issue an update in the update manager. To disable automatic
web interface updates set to ``""``.

#### ``macros.{macro_name}.gcode: string[]``
Defines a macro with the name ``{macro_name}`` and sets the gcode that will be executed.

#### ``macros.{macro_name}.rename_existing: string``
If a macro with the name ``{macro_name}`` already exists, it will be renamed to this value.

#### ``octoprint_compat: boolean``
Simulate OctoPrint API endpoints to allow Gcode upload from slicers. Default is ``true``.

#### ``extended_logs: boolean``
Enable verbose logging. Useful for debugging and development. Default is ``false``. Note:
This will create very large log files quickly and will impact print performance.

## Command line arguments
- ``--find-ports`` List available serial ports and exit
- ``--silent`` No console output
- ``--no-log`` No file logging
- ``--extended-logs`` Include debugging information in console and logs
- ``--serve-static`` Serve ``www`` directory (useful for development)

## Disclaimer
Never leave your machine unattended. Do not make the API accessible from outside your local network. 
This software is in early development, bugs are expected.