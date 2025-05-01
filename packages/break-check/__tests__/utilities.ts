import { file, write } from "bun"

export async function bunCopyFile(
	srcPath: string,
	destPath: string,
): Promise<void> {
	const content = await file(srcPath).text()
	await write(destPath, content)
}
