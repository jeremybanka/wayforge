import { mutableAtom } from "atom.io"
import { useI, useJSON } from "atom.io/react"
import { UList } from "atom.io/transceivers/u-list"

const selectedTagKeysAtom = mutableAtom<UList<string>>({
	key: `selectedTagKeys`,
	class: UList,
})

function SelectedTags() {
	const selectedTagKeys = useJSON(selectedTagKeysAtom)
	const setSelectedTagKeys = useI(selectedTagKeysAtom)

	return (
		<>
			<button
				type="button"
				onClick={() =>
					setSelectedTagKeys((selectedTagKeys) =>
						selectedTagKeys.add(`typescript`),
					)
				}
			>
				Add TypeScript
			</button>
			{selectedTagKeys.map((tagKey) => (
				<div key={tagKey}>{tagKey}</div>
			))}
		</>
	)
}
