import * as fs from "node:fs"
import * as readline from "node:readline"

// Function to parse Nginx log date-time string into a Date object
function parseNginxDateTime(dateTimeStr: string): Date {
	// dateTimeStr is something like '10/Oct/2023:13:55:36 +0000'
	// Replace the first colon ':' after the day to a space to make it ISO 8601 compatible
	const isoDateTimeStr = dateTimeStr.replace(`:`, `T`).replace(` `, ``)
	// Now isoDateTimeStr is '10/Oct/2023T13:55:36 +0000'
	// Replace slashes with dashes and month names with numbers
	const formattedDateStr = isoDateTimeStr.replace(
		/(\d{2})\/(\w{3})\/(\d{4})T(.+)/,
		(match, day, monthStr, year, timeZonePart) => {
			const monthMap: { [key: string]: string } = {
				Jan: `01`,
				Feb: `02`,
				Mar: `03`,
				Apr: `04`,
				May: `05`,
				Jun: `06`,
				Jul: `07`,
				Aug: `08`,
				Sep: `09`,
				Oct: `10`,
				Nov: `11`,
				Dec: `12`,
			}
			const month = monthMap[monthStr]
			return `${year}-${month}-${day}T${timeZonePart}`
		},
	)
	// Now formattedDateStr is '2023-10-10T13:55:36 +0000'
	return new Date(formattedDateStr)
}

export async function getLogs(
	logger: Pick<Console, `error` | `info`>,
	logFilePath = `/var/log/nginx/access.log`,
	now = new Date(),
): Promise<Map<string, string[]>> {
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

	const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

	rl.on(`line`, (line) => {
		// Regular expression to extract IP and date-time from the log line
		const regex = /^(?<ip>\S+) \S+ \S+ \[(?<dateTime>.*?)\]/
		const match = line.match(regex)
		if (match?.groups) {
			const ip = match.groups.ip
			const dateTime = match.groups.dateTime // e.g., '10/Oct/2023:13:55:36 +0000'

			const logDate = parseNginxDateTime(dateTime)
			if (!Number.isNaN(logDate.getTime())) {
				if (logDate >= oneHourAgo && logDate <= now) {
					let logs = logsPerIpMap.get(ip)
					if (!logs) {
						logs = []
						logsPerIpMap.set(ip, logs)
					}
					logs.push(line)
				}
			} else {
				logger.error(`Failed to parse date: ${dateTime}`)
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
