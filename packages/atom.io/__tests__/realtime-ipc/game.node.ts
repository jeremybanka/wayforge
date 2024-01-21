process.stdout.write(`✨`)

process.stdin.on(`data`, (data) => {
	// Process the received message
	const message = data.toString().trim()
	console.log(`Parent says: ${message}`)

	// Send a response to the parent
	process.stdout.write(`Received your message: ${message}`)
})
