# flightdeck

lightweight process manager and updater for Node.js applications.

## flightdeck's cycle

- install an application
- spawn a process running the application
- await a web hook that says "a new version is ready!"
- download the new version
- tell the application process that an update is ready
- await the running process saying "ready to update"
- kill the running process and restart it
- install the new version
- spawn a process running the new version

## CLI completion

Both `flightdeck` and `klaxon` support tab completion for Bash, Zsh, Fish, Nushell, and Carapace. With the command installed on PATH, install the integration for your shell explicitly:

```sh
flightdeck completion install bash
klaxon completion install bash
```

Replace `bash` with `zsh`, `fish`, `nushell`, or `carapace`. Installation uses the shell's existing completion setup and does not edit shell profiles. Open a new shell afterward. To print an integration file for manual installation, use `flightdeck completion bash` or `klaxon completion bash`. See [Comline's shell setup requirements](../comline/README.md#shell-integrations).

FlightDeck completes config file paths for both startup and `kill`, directories for `--flightdeck-root-dir` and `schema --out-dir`, and command and option names. Klaxon completes `scramble` and option names. Completion does not read application configuration, parse JSON option values, start or kill services, or send notifications. Singleton options disappear from suggestions after use; their parsing behavior is unchanged. The completion transport reserves its management and protocol command names; use an explicit path such as `./completion` for a config file whose name collides with a reserved command.

## CLI option aliases and warnings

The following aliases work alongside the original option names. Configuration file keys remain unchanged.

| Command           | Original option       | Alias                   |
| ----------------- | --------------------- | ----------------------- |
| flightdeck        | `--packageName`       | `--package-name`        |
| flightdeck        | `--flightdeckRootDir` | `--flightdeck-root-dir` |
| flightdeck        | `--jsonLogging`       | `--json-logging`        |
| flightdeck schema | `--outdir`            | `--out-dir`             |
| klaxon scramble   | `--packageConfig`     | `--package-config`      |
| klaxon scramble   | `--secretsConfig`     | `--secrets-config`      |
| klaxon scramble   | `--publishedPackages` | `--published-packages`  |

After successful parsing, both commands warn on stderr about unknown options and options that do not apply to the selected command. For example, `flightdeck schema --port=8080` warns that `--port` is ignored. Warnings are advisory and preserve the command's exit status. FlightDeck warnings remain separate from JSON logs on stdout.
