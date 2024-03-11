import chokidar from "chokidar"
import { transform } from "lightningcss"
import npmlog from "npmlog"

const INPUT_FILE = `./src/main.scss`
const OUTPUT_FILE = `./src/styles.gen.ts`

const myArgs = process.argv.slice(2)
const lastArgument = myArgs[myArgs.length - 1]
if (!lastArgument) {
	npmlog.error(`usage`, `No arguments provided: specify 'watch' or 'once'`)
	process.exit(1)
}

async function gen() {
	npmlog.info(`reading`, INPUT_FILE)
	const scss = await Bun.file(INPUT_FILE).arrayBuffer()
	const { code } = transform({ filename: INPUT_FILE, code: Buffer.from(scss) })
	npmlog.info(`writing`, OUTPUT_FILE)
	await Bun.write(
		OUTPUT_FILE,
		`/* eslint-disable */\nexport const main = ${JSON.stringify(
			code.toString(),
		)};`,
	)
}

switch (lastArgument) {
	case `watch`:
		await gen()
		npmlog.info(`watch`, INPUT_FILE)
		chokidar.watch(INPUT_FILE).on(`change`, () => {
			npmlog.info(`changed`, INPUT_FILE)
			void gen()
		})
		break
	case `once`:
		npmlog.info(`once`, INPUT_FILE)
		void gen()
		break
	default:
		npmlog.error(`usage`, `Invalid argument: specify 'watch' or 'once'`)
		process.exit(1)
}
