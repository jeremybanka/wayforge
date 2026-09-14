import { required } from "treetrunks"

import { cli } from "../../src/cli"
import { argv } from "../fixtures/argv"
import {
	createDelimiterOptions,
	literalOptionTokens,
} from "../fixtures/invocation-cases"

const optionGroup = createDelimiterOptions()

test.each(literalOptionTokens)(
	`uses the exact routed input record after a delimiter: %s`,
	(token) => {
		const routedCli = cli({
			cliName: `probe`,
			discoverConfigPath: () => undefined,
			routes: required({ run: required({ $value: null }) }),
			routeOptions: { "run/$value": optionGroup },
		})
		expect(
			routedCli(argv(`--name`, `before`, `run`, `--`, token)).inputs,
		).toEqual({
			case: `run/$value`,
			path: [`run`, token],
			opts: { name: `before` },
		})
	},
)
