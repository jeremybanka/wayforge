import { S3Client, write } from "bun"

import { logger } from "./logger"
import { env } from "./recoverage.env"

let s3isInitialized = false
export function initS3(): void {
	if (
		!s3isInitialized &&
		env.R2_ACCESS_KEY_ID &&
		env.R2_SECRET_ACCESS_KEY &&
		env.R2_URL
	) {
		Bun.s3 = new S3Client({
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			region: `auto`,
			endpoint: env.R2_URL,
			bucket: `atomio-coverage`,
		})
		s3isInitialized = true
	}
}

export async function downloadCoverageDatabaseFromS3(): Promise<void> {
	initS3()
	if (!s3isInitialized) {
		return
	}
	logger.mark?.(`downloading coverage database from R2`)
	const remote = Bun.s3.file(`coverage.sqlite`)
	try {
		await write(`./coverage.sqlite`, remote)
		logger.mark?.(`downloaded coverage database from R2`)
	} catch (error) {
		console.error(error)
		logger.mark?.(`downloading coverage database from R2 failed`)
	}
}

export async function uploadCoverageDatabaseToS3(): Promise<void> {
	initS3()
	if (!s3isInitialized) {
		return
	}
	const sqliteFile = Bun.s3.file(`coverage.sqlite`)
	logger.mark?.(`uploading coverage database to R2`)
	await sqliteFile.write(Bun.file(`coverage.sqlite`))
	logger.mark?.(`uploaded coverage database to R2`)
}
