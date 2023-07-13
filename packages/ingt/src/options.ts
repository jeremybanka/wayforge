export type FilestoreOptions = {
	formatResource?: (unformatted: string) => Promise<string>
	baseDir: string
	logger: Pick<Console, `error` | `info` | `warn`>
}

export const DEFAULT_FILESTORE_OPTIONS: FilestoreOptions = {
	formatResource: (unformatted) => Promise.resolve(unformatted),
	baseDir: `json`,
	logger: console,
}
