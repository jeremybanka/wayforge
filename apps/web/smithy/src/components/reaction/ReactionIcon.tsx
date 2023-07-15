import type { FC } from "react"

import { css } from "@emotion/react"
import corners, { chamfer, writePathPoint } from "corners"
import { pipe } from "fp-ts/function"
import { useNavigate } from "react-router-dom"
import { useRecoilValue } from "recoil"

import { ListItems } from "~/packages/hamr/src/recoil-tools/RecoilList"
import { Luum } from "~/packages/luum.js/src"

import { findEnergyState } from "../../services/energy"
import { findReactionEnergyState } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import { findReactionWithRelationsState } from "../../services/reaction"
import { Span_VoidIcon, Span_EnergyAmount } from "../energy/EnergyIcon"

const fancyModeListCss = css`
  width: 50%;
`

const SvgArrow = (props: { fillHex: string; strokeHex: string }) => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 12 12"
		css={css`
      margin-right: -9px;
      margin-left: -9px;
      z-index: 1;
      cursor: pointer;
    `}
	>
		<title>Arrow</title>
		<path
			d={[
				writePathPoint(2, 4, `M`),
				writePathPoint(5, 4, `L`),
				writePathPoint(5, 0, `L`),
				writePathPoint(10, 6, `L`),
				writePathPoint(5, 12, `L`),
				writePathPoint(5, 8, `L`),
				writePathPoint(2, 8, `L`),
				`Z`,
			].join(` `)}
			fill={props.fillHex}
			stroke={props.strokeHex}
		/>
	</svg>
)

export const ReactionIcon_INTERNAL: FC<{
	reaction: Reaction & ReactionRelations
	size: number
	mode?: `basic` | `fancy`
	clickable?: boolean
}> = ({ reaction, size, mode = `basic`, clickable = true }) => {
	const energy = useRecoilValue(findReactionEnergyState(reaction.id))
	const colorA = Luum.fromJSON(energy.colorA)
	const colorB = Luum.fromJSON(energy.colorB)
	const energyPresentHex = colorB.tint(10).hex
	const energyAbsentHex = colorB.shade(10).hex
	const doesProduceEnergy = reaction.products.some(
		(product) => product.id === energy.id,
	)
	const doesConsumeEnergy = reaction.reagents.some(
		(reagent) => reagent.id === energy.id,
	)
	const navigate = useNavigate()

	const handleClick = clickable
		? () => navigate(`/reaction/${reaction.id}`)
		: undefined

	return (
		<div
			onClick={handleClick}
			onKeyUp={handleClick}
			css={css`
        display: flex;
        align-items: center;
        > span {
          ${mode === `fancy` ? fancyModeListCss : ``}
          flex-grow: 1;
          height: 100%;
          display: flex;
          flex-direction: row;
          justify-content: center;
          padding: 10px;
          gap: 1px;
        }
      `}
		>
			<ListItems
				findState={findEnergyState}
				labels={reaction.reagents}
				Components={{
					Wrapper: pipe(
						`span`,
						corners(null, null, chamfer, null).options({
							cornerSize: 5,
							useClipPath: false,
							below: {
								color: doesConsumeEnergy ? energyPresentHex : energyAbsentHex,
								stroke: {
									color: energyAbsentHex,
									width: 1,
								},
							},
						}),
					),
					ListItem: ({ label, findState }) => (
						<Span_EnergyAmount
							label={label}
							findState={findState}
							removeMe={() => null}
							size={size}
							clickable={false}
						/>
					),
					NoItems: () => (
						<Span_VoidIcon size={15} colorA={colorB.tint(20)} colorB={colorB} />
					),
				}}
			/>
			<SvgArrow fillHex={colorA.hex} strokeHex={energyPresentHex} />
			<ListItems
				findState={findEnergyState}
				labels={reaction.products}
				Components={{
					Wrapper: pipe(
						`span`,
						corners(null, null, null, null).options({
							useClipPath: false,
							below: {
								color: doesProduceEnergy ? energyPresentHex : energyAbsentHex,
								stroke: {
									color: energyAbsentHex,
									width: 1,
								},
							},
						}),
					),
					ListItem: ({ label, findState }) => (
						<Span_EnergyAmount
							label={label}
							findState={findState}
							removeMe={() => null}
							size={size}
							clickable={false}
						/>
					),
					NoItems: () => (
						<Span_VoidIcon
							size={size}
							colorA={colorB.tint(20)}
							colorB={colorB}
						/>
					),
				}}
			/>
		</div>
	)
}

export const Div_ReactionIcon: FC<{ reactionId: string; size: number }> = ({
	reactionId,
	size,
}) => {
	const reaction = useRecoilValue(findReactionWithRelationsState(reactionId))
	return <ReactionIcon_INTERNAL reaction={reaction} size={size} />
}
