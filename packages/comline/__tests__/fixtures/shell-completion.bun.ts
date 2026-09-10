import { existsSync, mkdirSync, statSync } from "node:fs"

import { file, sleep, spawn, write } from "bun"

// Exercise the actual line editor through a PTY, without loading user startup files.
const [shell, setup, output, line] = process.argv.slice(2)
if (!shell || !setup || !output || line === undefined) {
	throw new Error(
		`Expected shell, setup file, output file, and input keystrokes`,
	)
}
const readyFile = `${output}.ready`
let init: string = `source '${setup}'; touch '${readyFile}'\n`
const environment: NodeJS.ProcessEnv = {
	...process.env,
	TERM: `xterm-256color`,
	COMLINE_TEST_OUTPUT: output,
}
let args: string[]
switch (shell) {
	case `bash`: {
		const completion =
			process.env[`BASH_COMPLETION_FILE`] ??
			`/usr/share/bash-completion/bash_completion`
		init = `source '${completion}'; ${init}`
		const startup = `${output}.rc`
		await write(startup, init)
		args = [shell, `--noprofile`, `--rcfile`, startup, `-i`]
		break
	}
	case `zsh`: {
		const startup = `${output}.zsh`
		mkdirSync(startup)
		// CI images can include unrelated insecure completion directories. Ignore
		// those entries instead of prompting or trusting them in an automated test.
		await write(
			`${startup}/.zshrc`,
			`autoload -Uz compinit; compinit -i -D; ${init}`,
		)
		environment[`ZDOTDIR`] = startup
		args = [shell, `-i`]
		break
	}
	case `fish`:
		args = [shell, `--no-config`, `--interactive`, `--init-command`, init]
		break
	case `nu`:
		args = [shell, `--no-config-file`, `--no-history`, `--execute`, init]
		break
	default:
		throw new Error(`Unsupported shell: ${shell}`)
}

let transcript: string = ``
let queries: string = ``
let exited: boolean = false
const decoder = new TextDecoder()
const child = spawn(args, {
	env: environment,
	// Inline options make Bun establish the child's controlling terminal.
	// Passing a reusable Terminal assumes its session is already established.
	terminal: {
		cols: 160,
		rows: 24,
		data(term, data) {
			const chunk = decoder.decode(data, { stream: true })
			transcript += chunk
			queries += chunk
			// Answer terminal queries, including ones split across data callbacks.
			for (const query of queries.matchAll(/\x1b\[(6n|0c)/g)) {
				term.write(query[1] === `6n` ? `\x1b[1;1R` : `\x1b[?1;2c`)
			}
			queries = queries.slice(-3)
		},
	},
	onExit() {
		exited = true
	},
})
await using terminal = child.terminal

async function waitFor(predicate: () => boolean, phase: string): Promise<void> {
	const deadline = performance.now() + 5_000
	while (!predicate()) {
		if (exited || performance.now() >= deadline) {
			throw new Error(`${shell}: failed waiting for ${phase}\n${transcript}`)
		}
		await sleep(20)
	}
}

try {
	if (!terminal) throw new Error(`Bun did not create a terminal for ${shell}`)
	// Startup files keep terminal negotiation from consuming setup as query replies.
	await waitFor(() => existsSync(readyFile), `shell startup`)
	terminal.write(`${line}\n`)
	await waitFor(
		() => existsSync(output) && statSync(output).size > 0,
		`completed command output`,
	)
	console.log((await file(output).text()).trim())
} finally {
	child.kill(`SIGKILL`)
	await child.exited
}
