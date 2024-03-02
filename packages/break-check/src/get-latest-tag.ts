import type { SimpleGit } from "simple-git"

export class TagRetrievalError extends Error {
	public constructor(public tagPattern: string) {
		super(`No tags found matching this pattern: ${tagPattern}`)
	}
}

export async function getLatestTag(
	git: SimpleGit,
	tagPattern?: string,
): Promise<string> {
	const tags = await git.tags()
	const tagsNewest = tags.all.toReversed()
	if (!tagPattern) {
		return tagsNewest[0]
	}
	const match = tagsNewest.find((tag) => tag.match(tagPattern))
	if (!match) {
		throw new TagRetrievalError(tagPattern)
	}
	return match
}
