import { atomFamily } from "atom.io"

export const USERS = {
	naive_cynic: {
		id: `naive_cynic`,
		name: `(= ФェФ=)`,
		salt: `2802230664852323`,
		hash: `e2a2b2c2d2e2f2g2h2i2j2k2l2m2n2o2p2q2r2s2t2u2v2w2x2y2z2a2b2c2d2e2f2g2h2i2j2k2l2m2n2o2p2q2r2s2t2u2v2w2x2y2z`,
	},
	crobert: {
		id: `crobert`,
		name: `Christopher Robert`,
		salt: `7101487517135394`,
		hash: `e2a2b2c2d2e2f2g2h2i2j2k2l2m2n2o2p2q2r2s2t2u2v2w2x2y2z2a2b2c2d2e2f2g2h2i2j2k2l2m2n2o2p2q2r2s2t2u2v2w2x2y2z`,
	},
	erythrine: {
		id: `erythrine`,
		name: `❤️`,
		salt: `5288259308172916`,
		hash: `e2a2b2c2d2e2f2g2h2i2j2k2l2m2n2o2p2q2r2s2t2u2v2w2x2y2z2a2b2c2d2e2f2g2h2i2j2k2l2m2n2o2p2q2r2s2t2u2v2w2x2y2z`,
	},
} as const

export const findSecretState = atomFamily<
	{ updatedAt: number; value: string },
	keyof typeof USERS
>({
	key: `secret`,
	default: {
		updatedAt: 0,
		value: ``,
	},
})
