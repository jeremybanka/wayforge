import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`src/socket-git-node.ts`, `src/socket-git-recoil.ts`],

	format: [`cjs`, `esm`],

	dts: true,

	external: [`react`, `recoil`, `socket.io`, `socket.io-client`],
})
