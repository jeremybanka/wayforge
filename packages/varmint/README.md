# varmint

<a aria-label="NPM version" href="https://www.npmjs.com/package/varmint">
	<img
		alt="NPM Version"
		src="https://img.shields.io/npm/v/varmint?style=for-the-badge"
	>
</a>
```sh
npm i varmint
```

varmint is way to create automatic mocks for your tests by wrapping asynchronous functions in a caching layer.

<!-- tonnage:default:start -->

## Bundle size

Package export sizes include complete runtime export surfaces.
Sizes are exact minified and level-9 gzip JavaScript byte counts. Declarations, source maps, CSS, and other assets are excluded. Peer dependencies stay external, and shared modules are counted once per bundle.

| Import               | Minified JS | Gzip JS |
| -------------------- | ----------: | ------: |
| <code>varmint</code> |    25,760 B | 8,746 B |

Report maintained with [tonnage](https://github.com/jeremybanka/tonnage).

<!-- tonnage:default:end -->

## CLI completion and warnings

With `varmint` installed on PATH, run `varmint completion install bash` to install Bash completion. Replace `bash` with `zsh`, `fish`, `nushell`, or `carapace` for the other supported integrations. Installation uses the shell's existing completion setup and does not edit shell profiles; open a new shell afterward. `varmint completion bash` prints the integration for manual installation. See [Comline's shell setup requirements](../comline/README.md#shell-integrations).

Completion suggests `track`, `clean`, and their option names. `varmint clean --ci-flag=` suggests `CI`, while the option continues to accept any environment-variable name. Once supplied, `--ci-flag` disappears from further suggestions. Completion works without reading configuration or starting tracking, uploading fixtures, or cleaning files.

After successful parsing, Varmint warns on stderr about unknown options and options that do not apply to the selected command. Warnings appear before workspace actions and do not change the command's exit status.
