import * as RTS from "atom.io/realtime-server"
import { letterAtoms, letterIndex } from "./game-store"

process.stdout.write(`✨`)

// Bun child process example
process.stdin.resume() // Ensure the stdin stream is in flowing mode

process.stdin.on(`data`, (data) => {
	const request = data.toString().trim()

	// Process the request here
	const result = processRequest(request) // Replace with actual processing logic

	// Send back the result
	process.stdout.write(`Result: ${result}\n`)
})

process.stdin.on(`end`, () => {
	// Handle end of communication
	cleanupResources()
	process.exit(0) // Exit if there are no more events to process
})

process.on(`SIGINT`, () => {
	// Handle graceful shutdown on interrupt signal
	cleanupResources()
	process.exit(0)
})

function processRequest(request) {
	// Implement the request processing logic here
	// For example, just echoing the request in this case
	return `Echoing: ${request}`
}

function cleanupResources() {
	// Cleanup resources if needed
	console.log(`Cleaning up resources before exit`)
}
