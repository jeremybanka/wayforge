export async function bunCopyFile(
	srcPath: string,
	destPath: string,
): Promise<void> {
	const content = await Bun.file(srcPath).text()
	await Bun.write(destPath, content)
}
