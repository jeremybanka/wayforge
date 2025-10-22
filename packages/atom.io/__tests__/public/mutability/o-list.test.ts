import type { Fn, Subject } from "atom.io/internal"
import type { ArrayUpdate } from "atom.io/transceivers/o-list"
import { OList } from "atom.io/transceivers/o-list"

import * as U from "../../__util__"

function handleUnpacked(subject: Subject<any>, handler: Fn): void {
	subject.subscribe(`unpack`, (update: any) => {
		handler(OList.unpackUpdate(update))
	})
}

beforeEach(() => {
	console.warn = () => undefined
	vitest.spyOn(console, `warn`).mockReset()
	vitest.spyOn(U, `stdout1`).mockReset()
	vitest.spyOn(U, `stdout2`).mockReset()
})

describe(`OList`, () => {
	describe(`constructor`, () => {
		it(`accepts nothing`, () => {
			const ol = new OList()
			expect(ol.length).toBe(0)
		})
		it(`accepts elements directly`, () => {
			const ol = new OList(`a`, `b`, `c`)
			expect(ol.length).toBe(3)
		})
		it(`accepts a length integer`, () => {
			const ol = new OList(3)
			expect(ol.length).toBe(3)
		})
	})
	describe(`observe`, () => {
		it(`emits set`, () => {
			const ol = new OList<string>()
			handleUnpacked(ol.subject, U.stdout1)
			U.handleBytes(ol.subject, U.stdout2)
			ol[0] = `b`
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `set`,
				index: 0,
				next: `b`,
			})
			expect(U.stdout2).toHaveBeenCalledExactlyOnceWith(48, 31, 48, 30, 3, 98)
		})
		it(`emits set with prev`, () => {
			const ol = new OList<string>(`a`)
			handleUnpacked(ol.subject, U.stdout1)
			U.handleBytes(ol.subject, U.stdout2)
			ol[0] = `b`
			expect(ol.includes(`a`)).toBe(false)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `set`,
				index: 0,
				next: `b`,
				prev: `a`,
			})
			expect(U.stdout2).toHaveBeenCalledExactlyOnceWith(
				48,
				31,
				48,
				30,
				3,
				98,
				30,
				3,
				97,
			)
		})
		it(`set length equal: does not emit`, () => {
			const ol = new OList(`a`, `b`, `c`)
			ol.subscribe(`TEST`, U.stdout1)
			ol.length = 3
			expect(U.stdout1).not.toHaveBeenCalled()
			expect(ol.length).toBe(3)
		})
		it(`set length less: emits truncate`, () => {
			const ol = new OList(`a`, `b`, `c`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.length = 2
			expect(ol.length).toBe(2)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `truncate`,
				length: 2,
				items: [`c`],
			})
		})
		it(`set length greater: emits extend`, () => {
			const ol = new OList(`a`, `b`, `c`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.length = 4
			expect(ol.length).toBe(4)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `extend`,
				next: 4,
				prev: 3,
			})
		})
		it(`emits push`, () => {
			const ol = new OList()
			handleUnpacked(ol.subject, U.stdout1)
			ol.push(`z`)
			expect(ol.length).toBe(1)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `push`,
				items: [`z`],
			})
		})
		it(`emits pop without value`, () => {
			const ol = new OList()
			handleUnpacked(ol.subject, U.stdout1)
			ol.pop()
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({ type: `pop` })
		})
		it(`emits pop with value`, () => {
			const ol = new OList(`a`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.pop()
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `pop`,
				value: `a`,
			})
		})
		it(`emits shift without value`, () => {
			const ol = new OList()
			handleUnpacked(ol.subject, U.stdout1)
			ol.shift()
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({ type: `shift` })
		})
		it(`emits shift with value`, () => {
			const ol = new OList(`a`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.shift()
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `shift`,
				value: `a`,
			})
		})
		it(`emits unshift`, () => {
			const ol = new OList()
			handleUnpacked(ol.subject, U.stdout1)
			ol.unshift(`z`)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `unshift`,
				items: [`z`],
			})
		})
		it(`emits reverse`, () => {
			const ol = new OList(`a`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.reverse()
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({ type: `reverse` })
		})
		it(`emits fill without start/end`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.fill(`d`)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `fill`,
				value: `d`,
				prev: [`a`, `b`, `c`],
			})
		})
		it(`emits fill with start`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.fill(`d`, 1)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `fill`,
				value: `d`,
				start: 1,
				prev: [`b`, `c`],
			})
		})
		it(`emits fill with start and end`, () => {
			const ol = new OList<string>(`a`, `b`, `c`, `d`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.fill(`d`, 1, 3)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `fill`,
				value: `d`,
				start: 1,
				end: 3,
				prev: [`b`, `c`],
			})
		})
		it(`emits fill with empty array`, () => {
			const ol = new OList<string>()
			handleUnpacked(ol.subject, U.stdout1)
			ol.fill(`yo`)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `fill`,
				value: `yo`,
				prev: [],
			})
		})
		it(`emits sort`, () => {
			const ol = new OList(`c`, `b`, `a`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.sort()
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `sort`,
				next: [`a`, `b`, `c`],
				prev: [`c`, `b`, `a`],
			})
		})
		it(`emits sort with empty array`, () => {
			const ol = new OList<string>()
			handleUnpacked(ol.subject, U.stdout1)
			ol.sort()
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `sort`,
				next: [],
				prev: [],
			})
		})
		it(`emits splice without deleteCount`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.splice(1)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `splice`,
				start: 1,
				items: [],
				deleted: [`b`, `c`],
				deleteCount: 2,
			})
		})
		it(`emits splice with deleteCount`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.splice(0, 1, `d`)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `splice`,
				start: 0,
				deleteCount: 1,
				items: [`d`],
				deleted: [`a`],
			})
		})
		it(`emits copyWithin without end`, () => {
			const ol = new OList<string>(`a`, `b`, `c`, `d`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.copyWithin(2, 0)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `copyWithin`,
				prev: [`c`, `d`],
				target: 2,
				start: 0,
			})
		})
		it(`emits copyWithin with end`, () => {
			const ol = new OList<string>(`a`, `b`, `c`, `d`)
			handleUnpacked(ol.subject, U.stdout1)
			ol.copyWithin(2, 0, 2)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `copyWithin`,
				prev: [`c`, `d`],
				target: 2,
				start: 0,
				end: 2,
			})
		})
		it(`emits copyWithin with empty array`, () => {
			const ol = new OList<string>()
			handleUnpacked(ol.subject, U.stdout1)
			ol.copyWithin(2, 0)
			expect(U.stdout1).toHaveBeenCalledExactlyOnceWith({
				type: `copyWithin`,
				prev: [],
				target: 2,
				start: 0,
			})
		})

		it(`emits nothing after unsubscribe`, () => {
			const ol = new OList()
			const unsubscribe = ol.subscribe(`TEST`, U.stdout1)
			unsubscribe()
			ol.push(`x`)
			expect(U.stdout1).not.toHaveBeenCalled()
		})
	})

	describe(`do and undo`, () => {
		it(`set (overwrite existing)`, () => {
			const ol = new OList<string>(`a`)
			const update = OList.packUpdate({
				type: `set`,
				index: 0,
				next: `b`,
				prev: `a`,
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol.includes(`b`)).toBe(true)
			expect(ol.includes(`a`)).toBe(false)
			ol.undo(update)
			expect(ol.includes(`b`)).toBe(false)
			expect(ol.includes(`a`)).toBe(true)
		})
		it(`set (insert new)`, () => {
			const ol = new OList<string>(`a`)
			const update = OList.packUpdate({
				type: `set`,
				index: 1,
				next: `b`,
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			ol.undo(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(undefined)
			expect(ol.length).toBe(1)
		})
		it(`set (insert new, make sparse)`, () => {
			const ol = new OList<string>(`a`)
			const update = OList.packUpdate({
				type: `set`,
				index: 9,
				next: `b`,
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[9]).toBe(`b`)
			expect(ol.length).toBe(10)
			ol.undo(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[9]).toBe(undefined)
			expect(ol.length).toBe(1)
		})
		it(`truncate`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `truncate`,
				length: 2,
				items: [`c`],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol.length).toBe(2)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(undefined)
			ol.undo(update)
			expect(ol.length).toBe(3)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
		})
		it(`extend`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `extend`,
				next: 4,
				prev: 3,
			} as ArrayUpdate<string>)
			ol.do(update)
			expect(ol.length).toBe(4)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
			expect(ol[3]).toBe(undefined)
			ol.undo(update)
			expect(ol.length).toBe(3)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
		})
		it(`fill without start/end`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `fill`,
				value: `d`,
				prev: [`a`, `b`, `c`],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol.length).toBe(3)
			expect(ol[0]).toBe(`d`)
			expect(ol[1]).toBe(`d`)
			expect(ol[2]).toBe(`d`)
			ol.undo(update)
			expect(ol.length).toBe(3)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
		})
		it(`fill with start/end`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `fill`,
				value: `d`,
				start: 1,
				end: 2,
				prev: [`b`],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol.length).toBe(3)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`d`)
			expect(ol[2]).toBe(`c`)
			ol.undo(update)
			expect(ol.length).toBe(3)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
		})
		it(`push`, () => {
			const ol = new OList<string>()
			const update = OList.packUpdate({
				type: `push`,
				items: [`foo`],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol.includes(`foo`)).toBe(true)
			ol.undo(update)
			expect(ol.includes(`foo`)).toBe(false)
		})
		it(`pop without value`, () => {
			const ol = new OList<string>()
			const update = OList.packUpdate({
				type: `pop`,
			} as ArrayUpdate<string>)
			ol.do(update)
			expect(ol.length).toBe(0)
			ol.undo(update)
			expect(ol.length).toBe(0)
		})
		it(`pop with value`, () => {
			const ol = new OList<string>(`a`)
			const update = OList.packUpdate({
				type: `pop`,
				value: `a`,
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol.length).toBe(0)
			ol.undo(update)
			expect(ol.length).toBe(1)
			expect(ol[0]).toBe(`a`)
		})
		it(`shift without value`, () => {
			const ol = new OList<string>(`a`)
			const update = OList.packUpdate({
				type: `shift`,
			} as ArrayUpdate<string>)
			ol.do(update)
			expect(ol.length).toBe(0)
			ol.undo(update)
			expect(ol.length).toBe(0)
		})
		it(`shift with value`, () => {
			const ol = new OList<string>(`a`)
			const update = OList.packUpdate({
				type: `shift`,
				value: `a`,
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol.length).toBe(0)
			ol.undo(update)
			expect(ol.length).toBe(1)
			expect(ol[0]).toBe(`a`)
		})
		it(`unshift`, () => {
			const ol = new OList<string>()
			const update = OList.packUpdate({
				type: `unshift`,
				items: [`foo`],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol.includes(`foo`)).toBe(true)
			ol.undo(update)
			expect(ol.includes(`foo`)).toBe(false)
		})
		it(`reverse`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `reverse`,
			} as ArrayUpdate<string>)
			ol.do(update)
			expect(ol[0]).toBe(`c`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`a`)
			ol.undo(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
		})
		it(`sort`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `sort`,
				next: [`c`, `b`, `a`],
				prev: [`a`, `b`, `c`],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol[0]).toBe(`c`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`a`)
			ol.undo(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
		})
		it(`splice without deleteCount`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `splice`,
				start: 1,
				deleted: [`b`, `c`],
				deleteCount: 2,
				items: [],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(undefined)
			expect(ol[2]).toBe(undefined)
			ol.undo(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
		})
		it(`splice with deleteCount 0 and items`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `splice`,
				start: 1,
				deleteCount: 0,
				deleted: [],
				items: [`d`],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`d`)
			expect(ol[2]).toBe(`b`)
			expect(ol[3]).toBe(`c`)
			ol.undo(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
			expect(ol[3]).toBe(undefined)
		})
		it(`splice with deleteCount 1 and items`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			const update = OList.packUpdate({
				type: `splice`,
				start: 0,
				deleteCount: 1,
				items: [`d`],
				deleted: [`a`],
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol[0]).toBe(`d`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
			ol.undo(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
		})
		it(`copyWithin`, () => {
			const ol = new OList<string>(`a`, `b`, `c`, `d`)
			const update = OList.packUpdate({
				type: `copyWithin`,
				prev: OList.fromJSON([`c`, `d`]),
				target: 2,
				start: 0,
			} satisfies ArrayUpdate<string>)
			ol.do(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`a`)
			expect(ol[3]).toBe(`b`)
			ol.undo(update)
			expect(ol[0]).toBe(`a`)
			expect(ol[1]).toBe(`b`)
			expect(ol[2]).toBe(`c`)
			expect(ol[3]).toBe(`d`)
		})
	})

	describe(`serialization`, () => {
		it(`should return an array`, () => {
			const ol = new OList<string>(`a`, `b`, `c`)
			ol.push(`d`)
			ol.shift()
			const json = ol.toJSON()
			expect(json).toEqual([`b`, `c`, `d`])
			const ol2 = OList.fromJSON(json)
			expect(ol2).toEqual(ol)
		})
	})
})
