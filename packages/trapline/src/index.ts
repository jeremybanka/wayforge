const Progress = require(`are-we-there-yet`)
// const EE = require(`events`).EventEmitter
import { EventEmitter } from "node:events"
const util = require(`util`)
import Gauge from "gauge"

// export const log = new EE()

const setBlocking = require(`set-blocking`)
const consoleControl = require(`console-control-strings`)

class Logger extends EventEmitter {
	public stream: NodeJS.WriteStream = process.stderr
	public colorEnabled: boolean | null = null
	public unicodeEnabled: boolean | null = null
	public gauge = new Gauge(stream, {
		enabled: false, // no progress bars unless asked
		theme: { hasColor: this.useColor() },
		template: [
			{ type: `progressbar`, length: 20 },
			{ type: `activityIndicator`, kerning: 1, length: 1 },
			{ type: `section`, default: `` },
			`:`,
			{ type: `logline`, kerning: 1, default: `` },
		],
	})
	public useColor(): boolean {
		return Boolean(this.colorEnabled ?? this.stream.isTTY)
	}
	public enableColor(): void {
		this.colorEnabled = true
		this.gauge.setTheme({
			hasColor: this.colorEnabled,
			hasUnicode: this.unicodeEnabled,
		})
	}
	public disableColor(): void {
		this.colorEnabled = false
		this.gauge.setTheme({
			hasColor: this.colorEnabled,
			hasUnicode: this.unicodeEnabled,
		})
	}
	public constructor() {
		super()
		setBlocking(true)
		let stream = process.stderr
		Object.defineProperty(log, `stream`, {
			set: function (newStream) {
				stream = newStream
				if (this.gauge) {
					this.gauge.setWriteTo(stream, stream)
				}
			},
			get: () => stream,
		})

		// default level
		this.level = `info`

		this.tracker = new Progress.TrackerGroup()

		// we track this separately as we may need to temporarily disable the
		// display of the status bar for our own loggy purposes.
		this.progressEnabled = this.gauge.isEnabled()

		let unicodeEnabled: boolean

		log.enableUnicode = function () {
			unicodeEnabled = true
			this.gauge.setTheme({
				hasColor: this.useColor(),
				hasUnicode: unicodeEnabled,
			})
		}

		log.disableUnicode = function () {
			unicodeEnabled = false
			this.gauge.setTheme({
				hasColor: this.useColor(),
				hasUnicode: unicodeEnabled,
			})
		}

		log.setGaugeThemeset = function (themes) {
			this.gauge.setThemeset(themes)
		}

		log.setGaugeTemplate = function (template) {
			this.gauge.setTemplate(template)
		}

		log.enableProgress = function () {
			if (this.progressEnabled || this._paused) {
				return
			}

			this.progressEnabled = true
			this.tracker.on(`change`, this.showProgress)
			this.gauge.enable()
		}

		log.disableProgress = function () {
			if (!this.progressEnabled) {
				return
			}
			this.progressEnabled = false
			this.tracker.removeListener(`change`, this.showProgress)
			this.gauge.disable()
		}

		const trackerConstructors = [`newGroup`, `newItem`, `newStream`]

		const mixinLog = (tracker) => {
			// mixin the public methods from log into the tracker
			// (except: conflicts and one's we handle specially)
			for (const P of Object.keys(log)) {
				if (P.startsWith(`_`)) {
					return
				}

				if (trackerConstructors.filter((C) => C === P).length) {
					return
				}

				if (tracker[P]) {
					return
				}

				if (typeof log[P] !== `function`) {
					return
				}

				const func = log[P]
				tracker[P] = (...args) => func.apply(log, args)
			}
			// if the new tracker is a group, make sure any subtrackers get
			// mixed in too
			if (tracker instanceof Progress.TrackerGroup) {
				for (const C of trackerConstructors) {
					const func = tracker[C]
					tracker[C] = (...args) => mixinLog(func.apply(tracker, args))
				}
			}
			return tracker
		}

		// Add tracker constructors to the top level log object
		for (const C of trackerConstructors) {
			log[C] = function (...args) {
				return mixinLog(this.tracker[C].apply(this.tracker, args))
			}
		}

		log.clearProgress = function (cb) {
			if (!this.progressEnabled) {
				cb && process.nextTick(cb)
				return
			}

			this.gauge.hide(cb)
		}

		log.showProgress = function (name, completed) {
			if (!this.progressEnabled) {
				return
			}

			const values = {}
			if (name) {
				values.section = name
			}

			const last = log.record[log.record.length - 1]
			if (last) {
				values.subsection = last.prefix
				const disp = log.disp[last.level]
				let logline = this._format(disp, log.style[last.level])
				if (last.prefix) {
					logline += ` ` + this._format(last.prefix, this.prefixStyle)
				}

				logline += ` ` + last.message.split(/\r?\n/)[0]
				values.logline = logline
			}
			values.completed = completed || this.tracker.completed()
			this.gauge.show(values)
		}.bind(log) // bind for use in tracker's on-change listener

		// temporarily stop emitting, but don't drop
		log.pause = function () {
			this._paused = true
			if (this.progressEnabled) {
				this.gauge.disable()
			}
		}

		log.resume = function () {
			if (!this._paused) {
				return
			}

			this._paused = false

			const b = this._buffer
			this._buffer = []
			b.forEach(function (m) {
				this.emitLog(m)
			}, this)
			if (this.progressEnabled) {
				this.gauge.enable()
			}
		}

		log._buffer = []

		let id = 0
		log.record = []
		log.maxRecordSize = 10000
		log.log = function (lvl, prefix, message) {
			const l = this.levels[lvl]
			if (l === undefined) {
				return this.emit(
					`error`,
					new Error(util.format(`Undefined log level: %j`, lvl)),
				)
			}

			const a = new Array(arguments.length - 2)
			let stack = null
			for (let i = 2; i < arguments.length; i++) {
				const arg = (a[i - 2] = arguments[i])

				// resolve stack traces to a plain string.
				if (typeof arg === `object` && arg instanceof Error && arg.stack) {
					Object.defineProperty(arg, `stack`, {
						value: (stack = arg.stack + ``),
						enumerable: true,
						writable: true,
					})
				}
			}
			if (stack) {
				a.unshift(stack + `\n`)
			}
			message = util.format.apply(util, a)

			const m = {
				id: id++,
				level: lvl,
				prefix: String(prefix || ``),
				message: message,
				messageRaw: a,
			}

			this.emit(`log`, m)
			this.emit(`log.` + lvl, m)
			if (m.prefix) {
				this.emit(m.prefix, m)
			}

			this.record.push(m)
			const mrs = this.maxRecordSize
			const n = this.record.length - mrs
			if (n > mrs / 10) {
				const newSize = Math.floor(mrs * 0.9)
				this.record = this.record.slice(-1 * newSize)
			}

			this.emitLog(m)
		}.bind(log)

		log.emitLog = function (m) {
			if (this._paused) {
				this._buffer.push(m)
				return
			}
			if (this.progressEnabled) {
				this.gauge.pulse(m.prefix)
			}

			const l = this.levels[m.level]
			if (l === undefined) {
				return
			}

			if (l < this.levels[this.level]) {
				return
			}

			if (l > 0 && !isFinite(l)) {
				return
			}

			// If 'disp' is null or undefined, use the lvl as a default
			// Allows: '', 0 as valid disp
			const disp = log.disp[m.level]
			this.clearProgress()
			m.message.split(/\r?\n/).forEach(function (line) {
				const heading = this.heading
				if (heading) {
					this.write(heading, this.headingStyle)
					this.write(` `)
				}
				this.write(disp, log.style[m.level])
				const p = m.prefix || ``
				if (p) {
					this.write(` `)
				}

				this.write(p, this.prefixStyle)
				this.write(` ` + line + `\n`)
			}, this)
			this.showProgress()
		}

		log._format = function (msg, style) {
			if (!stream) {
				return
			}

			let output = ``
			if (this.useColor()) {
				style = style || {}
				const settings = []
				if (style.fg) {
					settings.push(style.fg)
				}

				if (style.bg) {
					settings.push(`bg` + style.bg[0].toUpperCase() + style.bg.slice(1))
				}

				if (style.bold) {
					settings.push(`bold`)
				}

				if (style.underline) {
					settings.push(`underline`)
				}

				if (style.inverse) {
					settings.push(`inverse`)
				}

				if (settings.length) {
					output += consoleControl.color(settings)
				}

				if (style.beep) {
					output += consoleControl.beep()
				}
			}
			output += msg
			if (this.useColor()) {
				output += consoleControl.color(`reset`)
			}

			return output
		}

		log.write = function (msg, style) {
			if (!stream) {
				return
			}

			stream.write(this._format(msg, style))
		}

		log.addLevel = function (lvl, n, style, disp) {
			// If 'disp' is null or undefined, use the lvl as a default
			if (disp == null) {
				disp = lvl
			}

			this.levels[lvl] = n
			this.style[lvl] = style
			if (!this[lvl]) {
				this[lvl] = function () {
					const a = new Array(arguments.length + 1)
					a[0] = lvl
					for (let i = 0; i < arguments.length; i++) {
						a[i + 1] = arguments[i]
					}

					return this.log.apply(this, a)
				}.bind(this)
			}
			this.disp[lvl] = disp
		}

		log.prefixStyle = { fg: `magenta` }
		log.headingStyle = { fg: `white`, bg: `black` }

		log.style = {}
		log.levels = {}
		log.disp = {}
		log.addLevel(`silly`, Number.NEGATIVE_INFINITY, { inverse: true }, `sill`)
		log.addLevel(`verbose`, 1000, { fg: `cyan`, bg: `black` }, `verb`)
		log.addLevel(`info`, 2000, { fg: `green` })
		log.addLevel(`timing`, 2500, { fg: `green`, bg: `black` })
		log.addLevel(`http`, 3000, { fg: `green`, bg: `black` })
		log.addLevel(`notice`, 3500, { fg: `cyan`, bg: `black` })
		log.addLevel(`warn`, 4000, { fg: `black`, bg: `yellow` }, `WARN`)
		log.addLevel(`error`, 5000, { fg: `red`, bg: `black` }, `ERR!`)
		log.addLevel(`silent`, Number.POSITIVE_INFINITY)

		// allow 'error' prefix
		log.on(`error`, () => {})
	}
}
