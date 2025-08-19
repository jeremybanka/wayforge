const LOGGER_ICON_DICTIONARY = {
	"⌛": `Timeline event fully captured`,
	"⏩": `Timeline redo`,
	"⏪": `Timeline undo`,
	"⏭️": `Transaction redo`,
	"⏮️": `Transaction undo`,
	"⏳": `Timeline event partially captured`,
	"⏹️": `Time-travel complete`,
	"✅": `Realtime transaction success`,
	"✨": `Computation complete`,
	"💣": `Dangerous action likely to cause bad errors`,
	"❗": `Dangerous action unless in development mode`,
	"❌": `Conflict prevents attempted action`,
	"⭕": `Operation start`,
	"🔴": `Operation complete`,
	"🚫": `Operation blocked`,
	"🟢": `Operation unblocked`,
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
export type LoggerIcon = keyof typeof LOGGER_ICON_DICTIONARY
export type TokenDenomination =
	| `atom_family`
	| `atom`
	| `continuity`
	| `key`
	| `mutable_atom_family`
	| `mutable_atom`
	| `readonly_held_selector_family`
	| `readonly_held_selector`
	| `readonly_pure_selector_family`
	| `readonly_pure_selector`
	| `state`
	| `timeline`
	| `transaction`
	| `unknown`
	| `writable_held_selector_family`
	| `writable_held_selector`
	| `writable_pure_selector_family`
	| `writable_pure_selector`

export const PRETTY_TOKEN_TYPES: Record<TokenDenomination, string> = {
	atom_family: `atom family`,
	atom: `atom`,
	continuity: `continuity`,
	key: `key`,
	mutable_atom_family: `atom family [m]`,
	mutable_atom: `atom [m]`,
	readonly_held_selector_family: `selector family [h]`,
	readonly_held_selector: `selector [h]`,
	readonly_pure_selector_family: `selector family`,
	readonly_pure_selector: `selector`,
	state: `state`,
	timeline: `timeline`,
	transaction: `transaction`,
	unknown: `unknown`,
	writable_held_selector_family: `selector family [wh]`,
	writable_held_selector: `selector [wh]`,
	writable_pure_selector_family: `selector family [w]`,
	writable_pure_selector: `selector [w]`,
}

export const LOG_LEVELS = [`info`, `warn`, `error`] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

export type LogFn = (
	icon: LoggerIcon,
	denomination: TokenDenomination,
	tokenKey: string,
	message: string,
	...rest: unknown[]
) => void
export type LogFilter = (
	...params: Parameters<LogFn>
) => Parameters<LogFn> | boolean

export type Logger = Record<LogLevel, LogFn>

export const simpleLog =
	(logLevel: keyof Logger): LogFn =>
	(icon, denomination, tokenKey, message, ...rest) => {
		/* eslint-disable-next-line no-console */
		console[logLevel](
			`${icon} ${PRETTY_TOKEN_TYPES[denomination]} \`${tokenKey}\` ${message}`,
			...rest,
		)
	}
export const simpleLogger: Logger = {
	error: simpleLog(`error`),
	info: simpleLog(`info`),
	warn: simpleLog(`warn`),
}

export class AtomIOLogger implements Logger {
	public logLevel: `error` | `info` | `warn` | null
	public filter: LogFilter | undefined
	private readonly logger: Logger

	public constructor(
		logLevel: `error` | `info` | `warn` | null,
		filter?: LogFilter,
		logger: Logger = simpleLogger,
	) {
		this.logLevel = logLevel
		this.filter = filter
		this.logger = logger
	}

	public error: LogFn = (...args) => {
		if (this.logLevel !== null) {
			const filterResult = this.filter?.(...args) ?? true
			if (filterResult === true) {
				this.logger.error(...args)
			} else if (filterResult) {
				this.logger.error(...filterResult)
			}
		}
	}
	public info: LogFn = (...args) => {
		if (this.logLevel === `info`) {
			const filterResult = this.filter?.(...args) ?? true
			if (filterResult === true) {
				this.logger.info(...args)
			} else if (filterResult) {
				this.logger.info(...filterResult)
			}
		}
	}
	public warn: LogFn = (...args) => {
		if (this.logLevel !== `error` && this.logLevel !== null) {
			const filterResult = this.filter?.(...args) ?? true
			if (filterResult === true) {
				this.logger.warn(...args)
			} else if (filterResult) {
				this.logger.warn(...filterResult)
			}
		}
	}
}
