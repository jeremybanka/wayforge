export type Logger = Pick<Console, `error` | `info` | `warn`>

export const LOG_LEVELS: ReadonlyArray<keyof Logger> = [
	`info`,
	`warn`,
	`error`,
] as const

export class AtomIOLogger implements Logger {
	public constructor(
		private readonly logger: Logger,
		public logLevel: `error` | `info` | `warn` | null,
		private readonly filter?: (message: string) => boolean,
	) {}

	public error(...args: any[]): void {
		if ((this.filter?.(args[0]) ?? true) && this.logLevel !== null) {
			this.logger.error(...args)
		}
	}
	public info(...args: any[]): void {
		if ((this.filter?.(args[0]) ?? true) && this.logLevel === `info`) {
			this.logger.info(...args)
		}
	}
	public warn(...args: any[]): void {
		if (
			(this.filter?.(args[0]) ?? true) &&
			this.logLevel !== `error` &&
			this.logLevel !== null
		) {
			this.logger.warn(...args)
		}
	}
}
