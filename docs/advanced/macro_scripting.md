# Macro Scripting

## Advanced G-code scripting

!!! warning

    Advanced macros allow execution of code. 
    Make sure to only use macros from trusted sources.

G-code macros are evaluated using [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
This allows you to use regular JavaScript in your custom macros.

### Arguments

Arguments passed to the macro are available through the `args` object.
If a value has been assigned to the parameter, its value is available as a `string`.
If only the parameter is provided, and it doesn't have a value, it is assigned
`true`. Take this command for example:

``
my_macro foo=bar baz
``

The `args` object would look like this:

```javascript
const args = {
    foo: "bar",
    baz: true
}
```

---

Let's look at a macro in practice:
```toml
[macros.list_arguments]
gcode = """
${Object.entries(args).map(([key, value]) => `M118 E1 ${key}=${value}`).join("\n")}
"""
```

To understand what this macro does, let's break it down in JavaScript:
```javascript
const gcode = `
    ${
        Object.entries(args)
            .map(([key, value]) =>
                `M118 E1 ${key}=${value}`)
            .join("\n")
    }
`;
```

As you can see, the macro maps all arguments into a `key=value` format, prepended
by `M118 E1` and are joined to a single string separated by a newline character.
This results in all arguments passed to this macro being printed to the console.
Paste this macro into your configuration and try it out yourself!

### Printer object

Marlinraker also passes a `printer` object to macros. The printer object is
defined as follows:

```typescript
declare const printer: {
    state: "ready" | "error" | "shutdown" | "startup";
    stateMessage: string;
    x: number;
    y: number;
    z: number;
    e: number;
    hasEmergencyParser: boolean;
    speedFactor: number;
    extrudeFactor: number;
    fanSpeed: number;
    capabilities: Record<string, boolean | undefined>;
    isAbsolute: boolean;
    isAbsoluteE: boolean;
    feedrate: number;
    isM73Supported: boolean;
    isPrusa: boolean;
    info: {
        machineType: string;
        firmwareName: string;
    };
    pauseState?: {
        x: number;
        y: number;
        isAbsolute: boolean;
        isAbsoluteE: boolean;
        feedrate: number;
    };
    printJob?: {
        state: "standby" | "printing" | "paused" | "complete" | "cancelled" | "error";
        filepath: string;
        filename: string;
        filePosition: number;
        progress: number;
        isPrinting: boolean;
        isReadyToPrint: boolean;
    };
};
```

For example, this macro would print Marlinraker's current state to
the console:

```toml
[macros.print_status]
gcode = """
M118 E1 ${printer.state}
"""
```

The `printer` object is read-only and available for all macros.