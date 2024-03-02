import type { SimpleGit } from "simple-git"

export class TagRetrievalError extends Error {
	public constructor(public tagPattern: string) {
		super(`No tags found matching this pattern.`)
	}
}

export async function getLatestTag(
	git: SimpleGit,
	tagPattern: string,
): Promise<string> {
	const tags = await git.tags()
	const match = tags.all
		.filter((tag) => tag.match(tagPattern))
		.sort()
		.reverse()[0]
	if (!match) {
		throw new TagRetrievalError(tagPattern)
	}
	return match
}
