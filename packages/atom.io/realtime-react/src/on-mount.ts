import { useSingleEffect } from "./use-single-effect"

export function onMount(effect: () => (() => void) | undefined): void {
	useSingleEffect(effect, [])
}
