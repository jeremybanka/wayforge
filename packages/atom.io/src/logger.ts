const LoggerIconDictionary = {
	"⌛": `Timeline event fully captured`,
	"⏩": `Timeline redo`,
	"⏪": `Timeline undo`,
	"⏭️": `Transaction redo`,
	"⏮️": `Transaction undo`,
	"⏳": `Timeline event partially captured`,
	"⏹️": `Time-travel complete`,
	"☝️": `Notice`,
	"♻️": `Realtime transaction synchronized`,
	"✅": `Realtime transaction success`,
	"✨": `Computation complete`,
	"❌": `Conflict prevents attempted outcome`,
	"⭕": `Operation start`,
	"🐞": `Possible bug in Atom.io`,
	"👀": `Subscription added`,
	"👪": `Family member added`,
	"📁": `Stow update`,
	"📃": `Copy mutable`,
	"📖": `Read state`,
	"📝": `Write state`,
	"📢": `Notify subscribers`,
	"🔌": `Register dependency`,
	"🔍": `Discover root`,
	"🔥": `Delete state`,
	"🔧": `Create mutable atom`,
	"🔨": `Create immutable atom`,
	"🔴": `Operation complete`,
	"🗑": `Evict cached value`,
	"🙅‍♂️": `Reject promised value`,
	"🙈": `Subscription canceled`,
	"🛄": `Apply transaction`,
	"🛠️": `Install atom into store`,
	"🛫": `Begin transaction`,
	"🛬": `Complete transaction`,
	"🧮": `Computing selector`,
	"🧹": `Prepare to evict`,
	"🪂": `Abort transaction`,
} as const
export type LoggerIcon = keyof typeof LoggerIconDictionary

export const LOG_LEVELS = [`info`, `warn`, `error`] as const
export type LogLevel = typeof LOG_LEVELS[number]

export type LogFn = (
	icon: LoggerIcon,
	tokenType:
		| `atom`
		| `readonly_selector`
		| `selector`
		| `timeline`
		| `transaction`,
	tokenKey: string,
	message: string,
	...rest: any[]
) => void
export type LogFilter = (...params: Parameters<LogFn>) => boolean

export type Logger = Record<LogLevel, LogFn>

export const simpleLog =
	(logLevel: keyof Logger): LogFn =>
	(icon, tokenType, tokenKey, message, ...rest) => {
		console[logLevel](
			`${icon} ${tokenType} "${tokenKey}" ${message}`,
			...rest.map((arg) => JSON.stringify(arg)),
		)
	}
export const simpleLogger: Logger = {
	error: simpleLog(`error`),
	info: simpleLog(`info`),
	warn: simpleLog(`warn`),
}

export class AtomIOLogger implements Logger {
	public constructor(
		public logLevel: `error` | `info` | `warn` | null,
		private readonly filter?: LogFilter,
		private readonly logger: Logger = simpleLogger,
	) {}

	public error: LogFn = (...args) => {
		if ((this.filter?.(...args) ?? true) && this.logLevel !== null) {
			this.logger.error(...args)
		}
	}
	public info: LogFn = (...args) => {
		if ((this.filter?.(...args) ?? true) && this.logLevel === `info`) {
			this.logger.info(...args)
		}
	}
	public warn: LogFn = (...args) => {
		if (
			(this.filter?.(...args) ?? true) &&
			this.logLevel !== `error` &&
			this.logLevel !== null
		) {
			this.logger.warn(...args)
		}
	}
}
