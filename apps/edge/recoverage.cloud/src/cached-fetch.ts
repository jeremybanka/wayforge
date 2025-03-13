export const cachedFetch: typeof fetch = async (input, init) => {
	return fetch(input, {
		...init,
		cf: {
			// cacheEverything: true,
			// cacheTtlByStatus: {
			// 	"200-299": 60 * 60 * 24 * 7,
			// 	"400-499": 1,
			// 	"500-599": 60 * 60 * 24 * 30,
			// },
		},
	})
}
