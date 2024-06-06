import { tsDocWorkerJob } from "~/packages/atom.io/__scripts__/tsdoc.worker"

beforeEach(async () => {})
afterEach(() => {})

describe(`tsdoc.json`, () => {
	it(`builds docs for atom.io`, async () => {
		await tsDocWorkerJob({ data: `ephemeral` })
	})
})
