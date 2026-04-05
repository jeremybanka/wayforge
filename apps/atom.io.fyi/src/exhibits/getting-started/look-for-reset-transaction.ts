const resetTX = transaction<() => Promise<void>>({
	key: `reset`,
	do: async () => {
		// ...
	},
})
