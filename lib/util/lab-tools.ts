import * as fs from "node:fs"
import * as path from "node:path"

export type NoisyTools<ToolNames extends string> = Record<
	ToolNames,
	(options?: { silent: boolean }) => NoisyTools<ToolNames>
>

const labTools: NoisyTools<`disposeLab` | `setupLab`> = {
	disposeLab: ({ silent = false } = { silent: false }) => {
		const wayforgeLabDir = path.join(process.cwd(), `../../../wayforge-lab`)
		if (fs.existsSync(wayforgeLabDir)) {
			fs.rmSync(wayforgeLabDir, { recursive: true })
			if (!silent) console.info(`removed wayforge-lab directory`)
		} else {
			if (!silent) console.warn(`wayforge-lab directory does not exist`)
		}
		return labTools
	},
	setupLab: ({ silent = false } = { silent: false }) => {
		const currentDir = process.cwd()
		const wayforgeLabDir = path.join(currentDir, `../../../wayforge-lab`)

		if (!fs.existsSync(wayforgeLabDir)) {
			fs.mkdirSync(wayforgeLabDir)
			if (!silent) console.info(`created wayforge-lab directory`)
		} else {
			if (!silent) console.info(`found wayforge-lab directory`)
		}
		return labTools
	},
}

export const { disposeLab, setupLab } = labTools
