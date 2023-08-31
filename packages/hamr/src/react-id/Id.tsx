import {
	FloatingPortal,
	useClick,
	useFloating,
	useInteractions,
} from "@floating-ui/react"
import { pipe } from "fp-ts/function"
import * as React from "react"

import { stringToColor } from "~/packages/anvl/src/string/string-to-color"
import { contrastMax, hexToSpec, offset, specToHex } from "~/packages/luum/src"

export const Id: React.FC<{ id: string }> = ({ id }) => {
	const [isOpen, setIsOpen] = React.useState(false)
	const { refs, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement: `bottom-start`,
	})

	const click = useClick(context)
	const { getReferenceProps, getFloatingProps } = useInteractions([click])

	const bgColor = stringToColor(id)
	const contrastColor = pipe(bgColor, hexToSpec, contrastMax, specToHex)
	const offsetColor = pipe(bgColor, hexToSpec, offset(0.25), specToHex)
	const contrastOffsetColor = pipe(
		offsetColor,
		hexToSpec,
		contrastMax,
		specToHex,
	)

	return (
		<>
			<span
				role="content"
				ref={refs.setReference}
				{...getReferenceProps()}
				style={{
					background: bgColor,
					cursor: `pointer`,
					padding: `0px 4px`,
					color: contrastColor,
					userSelect: `none`,
					whiteSpace: `nowrap`,
				}}
			>
				{id.substring(0, 3)}
			</span>
			{isOpen && (
				<FloatingPortal>
					<span
						role="popup"
						ref={refs.setFloating}
						{...getFloatingProps()}
						style={{
							...floatingStyles,
							color: contrastOffsetColor,
							background: offsetColor,
							padding: `0px 4px`,
							boxShadow: `0px 2px 10px rgba(0, 0, 0, 0.1)`,
						}}
					>
						{id}
					</span>
				</FloatingPortal>
			)}
		</>
	)
}
