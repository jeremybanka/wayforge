import { exec } from "node:child_process"

import { Temporal } from "@js-temporal/polyfill"
import { discoverType } from "atom.io/introspection"
import { gt } from "drizzle-orm"
import type { OpenAiSafeGenerator } from "safegen/openai"

import { DatabaseManager } from "../../database/tempest-db-manager"
import { banishedIps } from "../../database/tempest-db-schema"
import { storage } from "../shared/storage"
import { iso8601 } from "../time"
import { getLogs } from "./get-logs"
import { banRulingSpec, logsToPrompt } from "./prompt"

export const ALWAYS_BAN_THESE_PHRASES = [`.env`, `php`]

export type TribunalOptions = {
	generator: OpenAiSafeGenerator
	logFilePath: string
	logger: Pick<Console, `error` | `info` | `warn`>
	now?: Date
}

export async function tribunal({
	generator,
	logFilePath,
	logger,
	now = new Date(),
}: TribunalOptions): Promise<void> {
	const initialUsdBudget = generator.usdBudget
	const db = new DatabaseManager({
		logQuery(query, params) {
			logger.info(`📝 query`, query, params)
		},
	})

	// get today's logs mapped by ip
	const logsPerIpMap = await getLogs(logger, logFilePath, now)

	// map to ban-decision
	const banRulings: { ip: string; reason: string }[] = []
	const generateBanRuling = generator.object(banRulingSpec)
	let logsDone = 0
	let notBanCount = 0
	for (const [ip, logs] of logsPerIpMap) {
		logger.info(`🔍 ruling on ${ip}. logs:`)
		logger.info(logs.map((log) => `\t${log}`).join(`\n`))
		let earlyExit = false
		for (const phrase of ALWAYS_BAN_THESE_PHRASES) {
			if (logs.some((log) => log.includes(phrase))) {
				banRulings.push({ ip, reason: `Always ban ${phrase}` })
				logger.info(`\t🧑‍⚖️ banning ${ip}--always ban ${phrase}\n`)
				earlyExit = true
				break
			}
		}
		if (earlyExit) {
			continue
		}
		if (generator.usdBudget > generator.usdMinimum) {
			const prompt = logsToPrompt(logs)
			const ruling = await generateBanRuling(prompt)
			if (ruling.shouldBanIp) {
				banRulings.push({ ip, reason: ruling.veryConciseReason })
				logger.info(`\t🧑‍⚖️ banning ${ip}--${ruling.veryConciseReason}\n`)
			} else {
				notBanCount++
				logger.info(`\t🕊️ not banning ${ip}\n`)
			}
			logsDone++
		} else {
			logger.warn(`💰 insufficient funds to process all logs`)
			logger.warn(`💰 got through ${logsDone}/${logsPerIpMap.size} ips\n`)
			break
		}
	}
	const banCount = banRulings.length

	// ban decisions to database
	if (banRulings.length > 0) {
		await db.drizzle.insert(banishedIps).values(banRulings).onConflictDoNothing()
	}

	// read cache file for current day
	const bansSinceLastFlush: { ip: string }[] = []
	const lastTribunalProcessedDateString = storage.getItem(
		`lastTribunalProcessedDate`,
	)
	const lastTribunalProcessedDate = iso8601(
		Temporal.Instant.from(lastTribunalProcessedDateString ?? `1970-01-01`),
	)
	try {
		bansSinceLastFlush.push(
			...(await db.drizzle.query.banishedIps.findMany({
				columns: { ip: true },
				where: gt(banishedIps.banishedAtIso, lastTribunalProcessedDate),
			})),
		)
	} catch (thrown) {
		logger.error(thrown)
	}

	// database to iptables
	try {
		if (process.env[`EXPERIMENTAL_BAN_IPS`]) {
			await Promise.all(
				bansSinceLastFlush.map(
					(ban) =>
						new Promise<void>((pass, fail) =>
							exec(`iptables -D INPUT -s ${ban.ip} -j DROP`).on(
								`exit`,
								(code) => {
									if (code === 0) {
										logger.info(`🧑‍⚖️ banned ${ban.ip}`)
										pass()
									} else {
										fail(new Error(`iptables exited with code ${code}`))
									}
								},
							),
						),
				),
			)
		} else {
			logger.info(`🧑‍⚖️ skipping iptables update`)
		}
	} catch (thrown) {
		if (thrown instanceof Error) {
			logger.error(thrown.message)
		} else {
			const thrownType = discoverType(thrown)
			logger.error(`iptables exited with error`, thrownType)
		}
	}

	// create cache file for current day
	storage.setItem(`lastTribunalProcessedDate`, now.toISOString())

	logger.info(`✨ banned ${banCount} ips, didn't ban ${notBanCount} ips`)

	const usdSpent = initialUsdBudget - generator.usdBudget
	// format to usd
	const remainingUsdBudgetFormatted = usdSpent.toLocaleString(`en`, {
		style: `currency`,
		currency: `USD`,
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	})
	const initialBudgetFormatted = initialUsdBudget.toLocaleString(`en`, {
		style: `currency`,
		currency: `USD`,
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	})
	const percentageSpent = Math.round((usdSpent / initialUsdBudget) * 100)
	logger.info(
		`💸 spent ${remainingUsdBudgetFormatted}, ${percentageSpent}% of ${initialBudgetFormatted} budget`,
	)
}
