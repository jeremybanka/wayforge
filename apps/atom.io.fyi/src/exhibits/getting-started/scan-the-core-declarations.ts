const pathKeysAtom = atom<string[]>({
	key: `pathKeys`,
	default: [],
})

const nodeAtoms = atomFamily<PointXY | null, string>({
	key: `node`,
	default: null,
})

const pathDrawSelectors = selectorFamily<string, string>({
	key: `pathDraw`,
	get:
		(pathKey) =>
		({ get }) => {
			// derive the SVG path string from the current state
		},
})
