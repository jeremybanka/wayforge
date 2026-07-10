const TYPESCRIPT_6_SDK = "6.0.3"
const TYPESCRIPT_6_FALLBACK = "6.0.2"
const TYPESCRIPT_7_PEER_RANGE = "^5.0.0 || ^6.0.0 || ^7.0.0"

const isTsdown = (packageJson) =>
	packageJson.name === "tsdown" &&
	packageJson.version?.startsWith("0.22.") === true

const isRolldownPluginDts = (packageJson) =>
	packageJson.name === "rolldown-plugin-dts" &&
	packageJson.version?.startsWith("0.27.") === true

const needsTypescript6 = (packageJson) =>
	packageJson.name === "@typescript-eslint/typescript-estree" &&
	packageJson.version?.startsWith("8.63.") === true &&
	packageJson.peerDependencies?.typescript !== undefined

const needsTypescript6Fallback = (packageJson) =>
	packageJson.name === "unplugin-dts" &&
	packageJson.version?.startsWith("1.0.") === true

export const hooks = {
	readPackage(packageJson) {
		if (needsTypescript6(packageJson)) {
			delete packageJson.peerDependencies.typescript
			delete packageJson.peerDependenciesMeta?.typescript
			packageJson.dependencies = {
				...packageJson.dependencies,
				typescript: TYPESCRIPT_6_SDK,
			}
		}

		if (needsTypescript6Fallback(packageJson)) {
			packageJson.dependencies = {
				...packageJson.dependencies,
				"@typescript/typescript6": TYPESCRIPT_6_FALLBACK,
			}
		}

		if (
			isTsdown(packageJson) &&
			packageJson.peerDependencies?.typescript !== undefined
		) {
			packageJson.peerDependencies.typescript = TYPESCRIPT_7_PEER_RANGE
		}

		if (isRolldownPluginDts(packageJson)) {
			delete packageJson.peerDependencies?.["@typescript/native-preview"]
			delete packageJson.peerDependenciesMeta?.["@typescript/native-preview"]

			if (packageJson.peerDependencies?.typescript !== undefined) {
				packageJson.peerDependencies.typescript = TYPESCRIPT_7_PEER_RANGE
			}
		}

		return packageJson
	},
}
