import { Join } from "anvl/join"
import * as v from "vitest"

import type { EmptyObject } from "~/packages/anvl/src/object"
import { isEmptyObject } from "~/packages/anvl/src/object"
import { Junction } from "~/packages/rel8/junction/src"

v.describe(`constructor`, () => {
	const str = `a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y`
	v.bench(`new Join`, () => {
		new Join()
	})
	v.bench(`new Join with a and b sides`, () => {
		new Join().from(`red`).to(`blue`)
	})
	v.bench(`new Junction`, () => {
		new Junction({ between: [`a`, `b`], cardinality: `1:n` })
	})
})

v.describe(`adding relations`, () => {
	const join = new Join()
	const junction = new Junction({ between: [`from`, `to`], cardinality: `1:n` })
	v.bench(`join.add`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			join.set({ from: char, to: char.repeat(2) })
		}
	})
	v.bench(`junction.add`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.set({ from: char, to: char.repeat(2) })
		}
	})
	v.bench(`junction.add (perf mode)`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.set(char, char.repeat(2))
		}
	})
})

v.describe(`getting relations`, () => {
	const join = new Join()
	const junction = new Junction({ between: [`from`, `to`], cardinality: `1:n` })
	for (const char of `abcdefghijklmnopqrstuvwxyz`) {
		join.set({ from: char, to: char.repeat(2) })
		junction.set({ from: char, to: char.repeat(2) })
	}
	v.bench(`join.get`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			join.getRelatedIds(char)
		}
	})

	v.bench(`junction.get`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.getRelatedKeys(char)
		}
	})
})

v.describe(`removing all relations to a key`, () => {
	const join = new Join()
	const junction = new Junction({ between: [`from`, `to`], cardinality: `1:n` })
	for (const char of `abcdefghijklmnopqrstuvwxyz`) {
		join.set({ from: char, to: char.repeat(2) })
		junction.set({ from: char, to: char.repeat(2) })
	}
	v.bench(`join.remove`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			join.remove({ from: char })
		}
	})
	v.bench(`junction.remove`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.delete({ from: char })
		}
	})
	v.bench(`junction.remove (perf mode)`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.delete(char)
		}
	})
})

v.describe(`removing the relation between two keys`, () => {
	const join = new Join()
	const junction = new Junction({ between: [`from`, `to`], cardinality: `1:n` })
	for (const char of `abcdefghijklmnopqrstuvwxyz`) {
		join.set({ from: char, to: char.repeat(2) })
		junction.set({ from: char, to: char.repeat(2) })
	}
	v.bench(`join.remove`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			join.remove({ from: char, to: char.repeat(2) })
		}
	})
	v.bench(`junction.remove`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.delete({ from: char, to: char.repeat(2) })
		}
	})
	v.bench(`junction.remove (perf mode)`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.delete(char, char.repeat(2))
		}
	})
})

v.describe(`adding relations with content`, () => {
	const join = new Join<EmptyObject>()
	const junction = new Junction(
		{ between: [`from`, `to`], cardinality: `1:n` },
		isEmptyObject,
	)
	v.bench(`join.add [content]`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			join.set({ from: char, to: char.repeat(2) }, {})
		}
	})
	v.bench(`junction.add [content]`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.set({ from: char, to: char.repeat(2) }, {})
		}
	})
	v.bench(`junction.add [content] (perf mode)`, () => {
		for (const char of `abcdefghijklmnopqrstuvwxyz`) {
			junction.set(char, char.repeat(2), {})
		}
	})
})
