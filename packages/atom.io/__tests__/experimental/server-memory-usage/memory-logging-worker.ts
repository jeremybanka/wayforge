import * as v8 from "node:v8"

// console.log(JSON.stringify(Object.keys(process.env).length))

if (process.env.WORKER) {
	function formatBytes(bytes) {
		const units = [`B`, `KB`, `MB`, `GB`, `TB`] as const
		let unitIndex = 0 as const
		let size = bytes

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024
			unitIndex++
		}

		return `${size.toFixed(2)} ${units[unitIndex]}`
	}

	function logMemoryUsage() {
		const heapStatistics = v8.getHeapStatistics()

		console.log(`Memory Usage:
  Heap Size Limit: ${formatBytes(heapStatistics.heap_size_limit)}
  Total Heap Size: ${formatBytes(heapStatistics.total_heap_size)}
  Used Heap Size: ${formatBytes(heapStatistics.used_heap_size)}
`)
	}
	try {
		await import(`atom.io`)
		setInterval(logMemoryUsage, 500)
	} catch (thrown) {
		if (thrown instanceof Error) {
			console.log(`Error: ${thrown.message}`)
		}
	}
}
