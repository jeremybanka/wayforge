export type AlertOptions = {
	secret: string
	endpoint: string
}

export async function alert({
	secret,
	endpoint,
}: AlertOptions): Promise<Response> {
	const response = await fetch(endpoint, {
		method: `POST`,
		headers: {
			"Content-Type": `application/json`,
			Authorization: `Bearer ${secret}`,
		},
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
	[key in K]: Response
}

export async function scramble<K extends string = string>({
	packageConfig,
	secretsConfig,
	publishedPackages,
}: ScrambleOptions<K>): Promise<ScrambleResult<K>> {
	const alertResults: Promise<readonly [K, Response]>[] = []
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
