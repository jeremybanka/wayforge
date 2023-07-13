import type {
	GetRecoilValue,
	RecoilState,
	RecoilValue,
	TransactionInterface_UNSTABLE as Transactors,
} from "recoil"

export type Getter<T> = (a: RecoilValue<T>) => T

export type Setter<T> = (s: RecoilState<T>, u: T | ((currVal: T) => T)) => void

export type Resetter = (s: RecoilState<any>) => void

export type Transact<FN extends (...ps: any[]) => any = () => void> = (
	transactors: Transactors,
	...rest: Parameters<FN>
) => ReturnType<FN>

export const readonlyTransactors = (get: GetRecoilValue): Transactors => ({
	get,
	set: () => console.warn(`readonlyOperation: set() is not supported`),
	reset: () => console.warn(`readonlyOperation: reset() is not supported`),
})
