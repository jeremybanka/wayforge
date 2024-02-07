const LoggerIconDictionary = {
	"⌛": `Timeline event fully captured`,
	"⏩": `Timeline redo`,
	"⏪": `Timeline undo`,
	"⏭️": `Transaction redo`,
	"⏮️": `Transaction undo`,
	"⏳": `Timeline event partially captured`,
	"⏹️": `Time-travel complete`,
	"✅": `Realtime transaction success`,
	"✨": `Computation complete`,
	"❌": `Conflict prevents attempted action`,
	"⭕": `Operation start`,
	"🐞": `Possible bug in AtomIO`,
	"👀": `Subscription added`,
	"👋": `Greeting`,
	"👍": `Realtime acknowledgment`,
	"👪": `Family member added`,
	"💁": `Notice`,
	"💥": `Caught`,
	"📁": `Stow update`,
	"📃": `Copy mutable`,
	"📖": `Read state`,
	"📝": `Write state`,
	"📢": `Notify subscribers`,
	"🔄": `Realtime transaction synchronized`,
	"🔌": `Register dependency`,
	"🔍": `Discover root`,
	"🔥": `Delete state`,
	"🔧": `Create mutable atom`,
	"🔨": `Create immutable atom`,
	"🔴": `Operation complete`,
	"🗑": `Evict cached value`,
	"🙈": `Subscription canceled`,
	"🚀": `Performance measure`,
	"🛄": `Apply transaction`,
	"🛠️": `Install atom into store`,
	"🛫": `Begin transaction`,
	"🛬": `Complete transaction`,
	"🧮": `Computing selector`,
	"🧹": `Prepare to evict`,
	"🪂": `Abort transaction`,
	"🤞": `Realtime optimistic update enqueued`,
	"👈": `Realtime confirmed update enqueued`,
	"🧑‍⚖️": `Realtime update beginning reconciliation`,
	"🛎️": `Realtime transaction received`,
	"🔭": `Determining realtime perspective`,
	"🖌": `Redacting realtime update`,
	"👁": `Determining perspective`,
} as const
export type LoggerIcon = keyof typeof LoggerIconDictionary
export type TokenDenomination =
	| `atom`
	| `continuity`
	| `mutable_atom`
	| `readonly_selector`
	| `selector`
	| `state`
	| `timeline`
	| `transaction`
	| `unknown`

export const LOG_LEVELS = [`info`, `warn`, `error`] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

export type LogFn = (
	icon: LoggerIcon,
	denomination: TokenDenomination,
	tokenKey: string,
	message: string,
	...rest: unknown[]
) => void
export type LogFilter = (...params: Parameters<LogFn>) => boolean

export type Logger = Record<LogLevel, LogFn>

export const simpleLog =
	(logLevel: keyof Logger): LogFn =>
	(icon, denomination, tokenKey, message, ...rest) => {
		console[logLevel](
			`${icon} ${denomination} "${tokenKey}" ${message}`,
			...rest,
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
