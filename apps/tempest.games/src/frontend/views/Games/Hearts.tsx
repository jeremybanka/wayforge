import type { RoomKey } from "atom.io/realtime"
import { myRoomKeySelector } from "atom.io/realtime-client"
import { usePullSelector } from "atom.io/realtime-react"
import type { ReactElement } from "react"

import scss from "./Hearts.module.scss"
import { MyDomain } from "./Hearts/my-domain/MyDomain"
import { EnemyDomains } from "./Hearts/other-players/EnemyDomains"
import { Public } from "./Hearts/public/Public"

export function Hearts(): ReactElement | null {
	const myRoomKey = usePullSelector(myRoomKeySelector)
	return myRoomKey ? <HeartsInterior roomKey={myRoomKey} /> : null
}

export type HeartsInteriorProps = {
	roomKey: RoomKey
}
export function HeartsInterior({ roomKey }: HeartsInteriorProps): ReactElement {
	return (
		<div className={scss[`class`]}>
			<section data-css="enemy-domains">
				<EnemyDomains />
			</section>
			<section data-css="public">
				<Public roomKey={roomKey} />
			</section>
			<section data-css="my-domain">
				<MyDomain />
			</section>
		</div>
	)
}
