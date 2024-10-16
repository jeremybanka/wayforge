import { exec } from "node:child_process"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import { discoverType } from "atom.io/introspection"
import { gt } from "drizzle-orm"
import type { OpenAiSafeGenerator } from "safegen/openai"
import { z } from "zod"

import { DatabaseManager } from "../../database/tempest-db-manager"
import { banishedIps } from "../../database/tempest-db-schema"
import { getLogs } from "./get-logs"
import { banRulingSpec, logsToPrompt } from "./prompt"

export type TribunalOptions = {
	generator: OpenAiSafeGenerator
	logFilePath: string
	logger: Pick<Console, `error` | `info` | `warn`>
}

export async function tribunal({
	generator,
	logFilePath,
	logger,
}: TribunalOptions): Promise<void> {
	const initialUsdBudget = generator.usdBudget
	const db = new DatabaseManager()

	// get today's logs mapped by ip
	const logsPerIpMap = await getLogs(logger, logFilePath)

	// map to ban-decision
	const banRulings: { ip: string; reason: string }[] = []
	const generateBanRuling = generator.from(banRulingSpec)
	let logsDone = 0
	let notBanCount = 0
	for (const [ip, logs] of logsPerIpMap) {
		if (generator.usdBudget > generator.usdFloor) {
			const prompt = logsToPrompt(logs)
			const ruling = await generateBanRuling(prompt)
			if (ruling.shouldBanIp) {
				banRulings.push({ ip, reason: ruling.veryConciseReason })
				logger.info(`🧑‍⚖️ banning ${ip}--${ruling.veryConciseReason}`)
			} else {
				notBanCount++
				logger.info(`🕊️ not banning ${ip}`)
			}
			logsDone++
		} else {
			logger.warn(`💰 insufficient funds to process all logs`)
			logger.warn(`💰 got through ${logsDone}/${logsPerIpMap.size} ips`)
			break
		}
	}
	const banCount = banRulings.length

	// ban decisions to database
	if (banRulings.length > 0) {
		await db.drizzle.insert(banishedIps).values(banRulings)
	}

	// read cache file for current day
	const bansSinceLastFlush: { ip: string }[] = []
	const cacheSchema = z.object({ lastDay: z.string() })
	const cacheFilePath = resolve(import.meta.dirname, `tribunal.cache.json`)
	const cacheFileExists = existsSync(cacheFilePath)
	const today = new Date()
	if (cacheFileExists) {
		const cacheFileContents = await readFile(cacheFilePath, `utf-8`)
		try {
			const cacheUnsafe = JSON.parse(cacheFileContents)
			const { lastDay } = cacheSchema.parse(cacheUnsafe)
			if (lastDay) {
				const cacheDay = new Date(lastDay)
				bansSinceLastFlush.push(
					...(await db.drizzle
						.select({
							ip: banishedIps.ip,
						})
						.from(banishedIps)
						.where(gt(banishedIps.banishedAt, cacheDay))),
				)
			}
		} catch (thrown) {
			logger.error(thrown)
		}
	}

	// database to iptables
	try {
		await Promise.all(
			bansSinceLastFlush.map(
				(ban) =>
					new Promise<void>((pass, fail) =>
						exec(`iptables -D INPUT -s ${ban.ip} -j DROP`).on(`exit`, (code) => {
							if (code === 0) {
								logger.info(`🧑‍⚖️ banned ${ban.ip}`)
								pass()
							} else {
								fail(new Error(`iptables exited with code ${code}`))
							}
						}),
					),
			),
		)
	} catch (thrown) {
		if (thrown instanceof Error) {
			logger.error(thrown.message)
		} else {
			const thrownType = discoverType(thrown)
			logger.error(`iptables exited with error`, thrownType)
		}
	}

	// create cache file for current day
	await writeFile(cacheFilePath, JSON.stringify({ lastDay: today }), `utf-8`)

	logger.info(`✨ banned ${banCount} ips, didn't ban ${notBanCount} ips`)

	const usdSpent = initialUsdBudget - generator.usdBudget
	// format to usd
	const remainingUsdBudgetFormatted = usdSpent.toLocaleString(`en`, {
		style: `currency`,
		currency: `USD`,
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	})
	const percentageSpent = Math.round((usdSpent / initialUsdBudget) * 100)
	logger.info(
		`💸 spent ${remainingUsdBudgetFormatted}, ${percentageSpent}% of initial budget`,
	)
}
