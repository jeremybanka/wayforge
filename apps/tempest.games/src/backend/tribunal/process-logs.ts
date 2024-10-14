import * as fs from "node:fs"
import * as readline from "node:readline"

import { encoding_for_model } from "tiktoken" // Install with `npm install tiktoken`

// Function to get today's date in the format used in Nginx logs
function getTodayDateStr(): string {
	const today = new Date()
	const dd = String(today.getUTCDate()).padStart(2, `0`)
	const MMM = today.toLocaleString(`en`, { month: `short`, timeZone: `UTC` })
	const yyyy = today.getUTCFullYear()
	return `${dd}/${MMM}/${yyyy}` // e.g., '10/Oct/2023'
}

export function processLogs(
	logger: Pick<Console, `error` | `info`>,
	logFilePath = `/var/log/nginx/access.log`,
): void {
	const todayDateStr = getTodayDateStr()

	// Check if the log file exists
	if (!fs.existsSync(logFilePath)) {
		logger.error(`Log file not found: ${logFilePath}`)
		return
	}

	const fileStream = fs.createReadStream(logFilePath)
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Number.POSITIVE_INFINITY,
	})

	const ipLogs: { [ip: string]: string[] } = {}

	rl.on(`line`, (line) => {
		// Regular expression to extract IP and date-time from the log line
		const regex = /^(?<ip>\S+) \S+ \S+ \[(?<dateTime>.*?)\]/
		const match = line.match(regex)
		if (match?.groups) {
			const ip = match.groups.ip
			const dateTime = match.groups.dateTime // e.g., '10/Oct/2023:13:55:36 +0000'
			// Extract the date part
			const dateMatch = dateTime.match(/^(?<date>\d{2}\/\w{3}\/\d{4})/)
			if (dateMatch?.groups) {
				const dateStr = dateMatch.groups.date
				if (dateStr === todayDateStr) {
					// This line is from today
					// Store the line under the IP
					if (!ipLogs[ip]) {
						ipLogs[ip] = []
					}
					ipLogs[ip].push(line)
				}
			}
		}
	})

	rl.on(`close`, () => {
		// After reading all lines, process the logs per IP
		const encoding = encoding_for_model(`gpt-3.5-turbo`) // You can change the model if needed
		for (const ip in ipLogs) {
			const logs = ipLogs[ip]
			const concatenatedLogs = logs.join(`\n`)
			const tokens = encoding.encode(concatenatedLogs)
			const tokenCount = tokens.length
			logger.info(`IP: ${ip}, Token count: ${tokenCount}, Logs: ${logs.length}`)
		}
		encoding.free() // Free the encoding resources
	})
}
