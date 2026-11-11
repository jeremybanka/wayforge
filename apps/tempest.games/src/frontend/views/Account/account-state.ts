import { atom, selector } from "atom.io"
import type { Tree, TreePath } from "treetrunks"
import { optional } from "treetrunks"

import type { ClientAuthData } from "../../../library/data-constraints"
import { authAtom, emailInputAtom } from "../../services/socket-auth-service"

const ACCOUNT_EDITING_STATES = optional({
	username: null,
	email: optional({
		otcLogin: optional({
			otcVerify: null,
		}),
		passwordLogin: optional({
			otcVerify: null,
		}),
	}),
	"new-password": optional({
		otcVerify: null,
	}),
}) satisfies Tree
export type AccountEditingState = TreePath<typeof ACCOUNT_EDITING_STATES>

export type AccountString = `email` | `new-password` | `username`
export type AccountConfirmationField = `otcLogin` | `otcVerify` | `passwordLogin`
export const accountDraftOwnerAtom = atom<ClientAuthData | null>({
	key: `accountDraftOwner`,
	default: null,
})
export const accountEditingAtom = atom<AccountEditingState>({
	key: `accountEditing`,
	default: [],
})

export const otcLoginFieldLabelSelector = selector<string>({
	key: `otcLoginFieldLabel`,
	get: ({ get }) => {
		const auth = get(authAtom)
		if (!auth) return ``
		return `Code sent to ${auth.email}`
	},
})
export const otcVerifyFieldLabelSelector = selector<string>({
	key: `otcVerifyFieldLabel`,
	get: ({ get }) => {
		const email = get(emailInputAtom)
		if (!email) return ``
		return `Code sent to ${email}`
	},
})
