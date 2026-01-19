import type { UserKey } from "atom.io/realtime"
import * as React from "react"

import { TheirHands } from "./TheirHands"

export const TheirStuff: React.FC<{ userKey: UserKey }> = ({ userKey }) => {
	return <TheirHands userKey={userKey} />
}
