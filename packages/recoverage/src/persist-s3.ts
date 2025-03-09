import { S3Client, write } from "bun"

import { logger } from "./logger"
import type { S3Credentials } from "./recoverage.env"

let s3isInitialized = false
export function initS3(credentials: S3Credentials): void {
	if (s3isInitialized) {
		return
	}
	Bun.s3 = new S3Client({
		...credentials,
		region: `auto`,
	})
	s3isInitialized = true
}

export async function downloadCoverageDatabaseFromS3(
	credentials: S3Credentials,
): Promise<void> {
	initS3(credentials)
	logger.mark?.(`downloading coverage database from S3`)
	const remote = Bun.s3.file(`coverage.sqlite`)
	try {
		await write(`./coverage.sqlite`, remote)
		logger.mark?.(`downloaded coverage database from S3`)
	} catch (error) {
		console.error(error)
		logger.mark?.(`downloading coverage database from S3 failed`)
	}
}

export async function uploadCoverageDatabaseToS3(
	credentials: S3Credentials,
): Promise<void> {
	initS3(credentials)
	const sqliteFile = Bun.s3.file(`coverage.sqlite`)
	logger.mark?.(`uploading coverage database to S3`)
	await sqliteFile.write(Bun.file(`coverage.sqlite`))
	logger.mark?.(`uploaded coverage database to S3`)
}
