import * as fs from "node:fs"
import * as readline from "node:readline"

// Function to get today's date in the format used in Nginx logs
function getTodayDateStr(): string {
	const today = new Date()
	const dd = String(today.getDate()).padStart(2, `0`)
	const MMM = today.toLocaleString(`en`, { month: `short`, timeZone: `PST` })
	const yyyy = today.getUTCFullYear()
	return `${dd}/${MMM}/${yyyy}` // e.g., '10/Oct/2023'
}

export async function processLogs(
	logger: Pick<Console, `error` | `info`>,
	logFilePath = `/var/log/nginx/access.log`,
): Promise<Map<string, string[]>> {
	const todayDateStr = getTodayDateStr()
	const logsPerIpMap = new Map<string, string[]>()

	// Check if the log file exists
	if (!fs.existsSync(logFilePath)) {
		logger.error(`Log file not found: ${logFilePath}`)
		return logsPerIpMap
	}

	const fileStream = fs.createReadStream(logFilePath)
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Number.POSITIVE_INFINITY,
	})

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
				console.log(dateStr, todayDateStr)
				if (dateStr === todayDateStr) {
					let logs = logsPerIpMap.get(ip)
					if (!logs) {
						logs = []
						logsPerIpMap.set(ip, logs)
					}
					logs.push(line)
				}
			}
		}
	})

	return new Promise((resolve, reject) => {
		rl.on(`error`, (error) => {
			reject(error)
		})
		rl.on(`close`, () => {
			resolve(logsPerIpMap)
		})
	})
}
