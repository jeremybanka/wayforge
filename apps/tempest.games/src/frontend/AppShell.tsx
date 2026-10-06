import {
	autoUpdate,
	flip,
	FloatingFocusManager,
	offset,
	shift,
	useClick,
	useDismiss,
	useFloating,
	useInteractions,
	useRole,
} from "@floating-ui/react"
import { setState } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { useO } from "atom.io/react"
import * as React from "react"

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
import { trpcClient } from "./services/trpc-client-service"
import { AccountView } from "./views/AccountView"
import { AdminView } from "./views/AdminView"
import { GameView } from "./views/GameView"
import { HomeView } from "./views/HomeView"
import { VerifyView } from "./views/VerifyView"

IMPLICIT.STORE.loggers[0].logLevel = `warn`

export function AppShell(): React.ReactNode {
	const route = useO(routeSelector)
	const auth = useO(authAtom)
	const connectionError = useO(connectionErrorAtom)

	const [accountPopOverIsOpen, setAccountPopOverOpen] = React.useState(false)
	const { refs, floatingStyles, context } = useFloating({
		open: accountPopOverIsOpen,
		onOpenChange: setAccountPopOverOpen,
		placement: `bottom-end`,
		middleware: [offset(5), flip(), shift()],
		whileElementsMounted: autoUpdate,
	})
	const click = useClick(context)
	const dismiss = useDismiss(context)
	const role = useRole(context)
	const { getReferenceProps, getFloatingProps } = useInteractions([
		click,
		dismiss,
		role,
	])

	const appVersion = useO(appVersionSelector)

	return (
		<app-shell className={css.class}>
			<app-layout>
				<header>
					<brand-lockup>
						{typeof route === `object` && route[0] === `game` ? null : (
							<svg.tempest />
						)}
						<span>
							<VersionSpinner input={appVersion} />
						</span>
					</brand-lockup>

					<button
						data-css="profile"
						ref={refs.setReference}
						{...getReferenceProps()}
					>
						{auth?.username ? auth.username.slice(0, 3) : ``}
					</button>
					{accountPopOverIsOpen && auth && (
						<profile-popover>
							<FloatingFocusManager context={context} modal={false}>
								<profile-actions
									ref={refs.setFloating}
									style={floatingStyles}
									{...getFloatingProps()}
								>
									<span>{auth.username}</span>
									<button
										type="button"
										onClick={() => {
											navigate(`/account`)
										}}
									>
										Account
									</button>
									<button
										type="button"
										onClick={async () => {
											if (!auth) return
											await trpcClient.closeSession.mutate({
												username: auth.username,
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
							</FloatingFocusManager>
						</profile-popover>
					)}
				</header>
				<main>
					{typeof route === `number` ? (
						<article>
							<h1>{route}</h1>
							<h2>{JSON.parse(RESPONSE_DICTIONARY[route])}</h2>
							<a href="/">Return to Home Page</a>
						</article>
					) : (
						(() => {
							switch (route[0]) {
								case undefined:
									return <HomeView />
								case `admin`:
									return <AdminView />
								case `game`:
									return <GameView route={route} />
								case `verify`:
									return <VerifyView route={route} />
								case `account`:
									return <AccountView />
							}
						})()
					)}
				</main>
			</app-layout>
			{connectionError ? (
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
