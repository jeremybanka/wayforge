import type { IncomingHttpHeaders, IncomingHttpStatusHeader } from "node:http2"
import { connect } from "node:http2"

export type AlertOptions = {
	secret: string
	endpoint: string
}

export type AlertResult =
	| {
			headers: IncomingHttpHeaders & IncomingHttpStatusHeader
			flags: number
	  }
	| { error: unknown[] }

async function alert({ secret, endpoint }: AlertOptions): Promise<AlertResult> {
	const client = connect(endpoint)
	const req = client.request({
		":method": `POST`,
		":path": `/`,
		authorization: `Bearer ${secret}`,
	})

	const response = await new Promise<
		| {
				headers: IncomingHttpHeaders & IncomingHttpStatusHeader
				flags: number
		  }
		| { error: unknown[] }
	>((pass) => {
		req.on(`response`, (headers, flags) => {
			pass({ headers, flags })
		})
		req.on(`error`, (...error) => {
			pass({ error })
		})
	})

	return response
}

/**
 * @see https://github.com/changesets/action/blob/main/src/run.ts
 */
export type ChangesetsPublishedPackage = {
	name: string
	version: string
}

/**
 * @see https://github.com/changesets/action/blob/main/src/run.ts
 */
export type ChangesetsPublishResult =
	| {
			published: true
			publishedPackages: ChangesetsPublishedPackage[]
	  }
	| { published: false }

export type PackageConfig<K extends string> = {
	[key in K]: { endpoint: string }
}
export type SecretsConfig<K extends string> = {
	[key in K]: string
}

export type ScrambleOptions<K extends string = string> = {
	packageConfig: PackageConfig<K>
	secretsConfig: SecretsConfig<K>
	publishedPackages: ChangesetsPublishedPackage[]
}

export type ScrambleResult<K extends string = string> = {
	[key in K]: AlertResult
}

export async function scramble<K extends string = string>({
	packageConfig,
	secretsConfig,
	publishedPackages,
}: ScrambleOptions<K>): Promise<ScrambleResult<K>> {
	const alertResults: Promise<readonly [K, AlertResult]>[] = []
	for (const publishedPackage of publishedPackages) {
		if (publishedPackage.name in packageConfig) {
			const name = publishedPackage.name as K
			const { endpoint } = packageConfig[name]
			const secret = secretsConfig[name]
			const alertResultPromise = alert({ secret, endpoint }).then(
				(alertResult) => [name, alertResult] as const,
			)
			alertResults.push(alertResultPromise)
		}
	}
	const alertResultsResolved = await Promise.all(alertResults)
	const scrambleResult = Object.fromEntries(
		alertResultsResolved,
	) as ScrambleResult<K>
	return scrambleResult
}
