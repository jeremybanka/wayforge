import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`src/socket-git-node.ts`, `src/socket-git-atom-client.ts`],

	format: [`cjs`, `esm`],

	dts: true,

	external: [`react`, `atom.io`, `socket.io`, `socket.io-client`],
})
