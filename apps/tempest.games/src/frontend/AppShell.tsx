import type { Children } from "@atom.io/spa"
import { onCleanup, onMount, useGetter } from "@atom.io/spa"
import {
	autoUpdate,
	computePosition,
	flip,
	offset,
	shift,
} from "@floating-ui/dom"
import { setState } from "atom.io"
import { IMPLICIT } from "atom.io/internal"

import { RESPONSE_DICTIONARY } from "../library/response-dictionary"
import * as svg from "./<svg>"
import css from "./AppShell.module.css"
import { VersionSpinner } from "./components/VersionSpinner"
import { appVersionSelector } from "./services/patchnotes-service"
import { navigate, routeSelector } from "./services/router-service"
import {
	authAtom,
	connectionErrorAtom,
	socket,
} from "./services/socket-auth-service"
import { useLocalState } from "./services/spa-state"
import { trpcClient } from "./services/trpc-client-service"
import { AccountView } from "./views/AccountView"
import { AdminView } from "./views/AdminView"
import { GameView } from "./views/GameView"
import { HomeView } from "./views/HomeView"
import { VerifyView } from "./views/VerifyView"

IMPLICIT.STORE.loggers[0].logLevel = `warn`

export function AppShell(): Children {
	const route = useGetter(routeSelector)
	const auth = useGetter(authAtom)
	const connectionError = useGetter(connectionErrorAtom)

	const [accountPopOverIsOpen, setAccountPopOverOpen] = useLocalState(false)
	let profileButton: HTMLButtonElement | null = null
	let profileActions: HTMLElement | null = null
	let stopPositioning = () => {}
	onCleanup(() => {
		stopPositioning()
	})
	onMount(() => {
		const dismiss = (event: PointerEvent) => {
			if (
				event.target instanceof Node &&
				!profileActions?.contains(event.target) &&
				!profileButton?.contains(event.target)
			)
				setAccountPopOverOpen(false)
		}
		const escape = (event: KeyboardEvent) => {
			if (event.key === `Escape` && accountPopOverIsOpen()) {
				setAccountPopOverOpen(false)
				profileButton?.focus()
			}
		}
		document.addEventListener(`pointerdown`, dismiss)
		document.addEventListener(`keydown`, escape)
		onCleanup(() => {
			document.removeEventListener(`pointerdown`, dismiss)
			document.removeEventListener(`keydown`, escape)
		})
	})

	const appVersion = useGetter(appVersionSelector)

	const isGameRoute = () => {
		const current = route()
		return typeof current === `object` && current[0] === `game`
	}
	const renderRoute = () => {
		const current = route()
		if (typeof current === `number`)
			return (
				<article>
					<h1>{current}</h1>
					<h2>{JSON.parse(RESPONSE_DICTIONARY[current])}</h2>
					<a href="/">Return to Home Page</a>
				</article>
			)
		switch (current[0]) {
			case undefined:
				return <HomeView />
			case `admin`:
				return <AdminView />
			case `game`:
				return <GameView key={current.join(`/`)} route={current} />
			case `verify`:
				return <VerifyView key={current.join(`/`)} route={current} />
			case `account`:
				return <AccountView />
		}
	}

	return (
		<app-shell className={css.class}>
			<app-layout>
				<header>
					<brand-lockup>
						{isGameRoute() ? null : <svg.tempest />}
						<span>
							<VersionSpinner input={appVersion()} />
						</span>
					</brand-lockup>

					<button
						data-css="profile"
						ref={(element) => {
							profileButton = element
						}}
						aria-haspopup="dialog"
						aria-expanded={accountPopOverIsOpen()}
						onClick={() => {
							setAccountPopOverOpen((open) => !open)
						}}
					>
						{auth()?.username ? auth()?.username?.slice(0, 3) : ``}
					</button>
					{accountPopOverIsOpen() && auth() && (
						<profile-popover>
							<profile-actions
								ref={(element) => {
									stopPositioning()
									profileActions = element
									if (element && profileButton) {
										const reference = profileButton
										let active = true
										const stop = autoUpdate(reference, element, () => {
											void computePosition(reference, element, {
												placement: `bottom-end`,
												middleware: [offset(5), flip(), shift()],
											}).then(({ x, y, strategy }) => {
												if (active)
													Object.assign(element.style, {
														position: strategy,
														left: `${Math.round(x * window.devicePixelRatio) / window.devicePixelRatio}px`,
														top: `${Math.round(y * window.devicePixelRatio) / window.devicePixelRatio}px`,
													})
											})
										})
										stopPositioning = () => {
											active = false
											stop()
										}
										queueMicrotask(() =>
											element.querySelector(`button`)?.focus(),
										)
									}
								}}
								role="dialog"
								aria-label="Account"
								onFocusOut={(event) => {
									if (
										event.relatedTarget instanceof Node &&
										!event.currentTarget.contains(event.relatedTarget) &&
										event.relatedTarget !== profileButton
									)
										setAccountPopOverOpen(false)
								}}
							>
								<span>{auth()?.username}</span>
								<button
									type="button"
									onClick={() => {
										navigate(`/account`)
										setAccountPopOverOpen(false)
									}}
								>
									Account
								</button>
								<button
									type="button"
									onClick={async () => {
										if (!auth()) return
										await trpcClient.closeSession.mutate({
											username: auth()!.username,
										})
										socket.once(`disconnect`, () => {
											setState(authAtom, null)
											navigate(`/`)
										})
										socket.disconnect()
									}}
								>
									Sign out
								</button>
							</profile-actions>
						</profile-popover>
					)}
				</header>
				<main>{renderRoute()}</main>
			</app-layout>
			{connectionError() ? (
				<aside>
					<connection-dialog>
						<h1>Disconnected</h1>
						<button type="button" onClick={() => socket.connect()}>
							Reconnect
						</button>
					</connection-dialog>
				</aside>
			) : null}
		</app-shell>
	)
}
