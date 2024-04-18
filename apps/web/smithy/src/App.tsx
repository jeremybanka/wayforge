import type { FC } from "react"
import { useRecoilValue } from "recoil"

import scss from "./App.module.scss"
import Connected from "./assets/svg/connected.svg?react"
import Disconnected from "./assets/svg/disconnected.svg?react"
import { Explorer } from "./Explorer"
import { Spaces } from "./NavigationSpace"
import { connectionState } from "./services/socket"

export const App: FC = () => {
	const connection = useRecoilValue(connectionState)
	return (
		<main className={scss.class}>
			<div>{connection ? <Connected /> : <Disconnected />}</div>
			<Explorer />
			<Spaces />
		</main>
	)
}
