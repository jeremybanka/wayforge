import { mkdir, rmdir } from "node:fs/promises"
import { setTimeout } from "node:timers/promises"

export async function withDirectoryLock<T>(
	lock: string,
	action: () => Promise<T>,
	waitForCleanup = false,
): Promise<T> {
	const deadline = Date.now() + 60_000
	for (;;) {
		try {
			await mkdir(lock)
			break
		} catch (thrown) {
			if ((thrown as NodeJS.ErrnoException).code !== `EEXIST`) throw thrown
			if (!waitForCleanup && Date.now() >= deadline) {
				throw new Error(
					`Timed out waiting for ${lock}. Check for an interrupted operation before removing this lock.`,
				)
			}
			await setTimeout(20)
		}
	}
	try {
		return await action()
	} finally {
		await rmdir(lock)
	}
}
