import type {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  PropsWithChildren,
  SVGProps,
} from "react"
import { useMemo, memo } from "react"

import type { SerializedStyles } from "@emotion/react"
import styled from "@emotion/styled"
import type { CornerOptions, DrawCorner, HTMLTagName } from "corners"
import corners, { round } from "corners"

import { isUndefined } from "~/lib/fp-tools"

export type CssProp = {
  s: SerializedStyles
}

export type CornersProps = {
  corners: DrawCorner | DrawCorner[]
  cornerOptions?: Partial<CornerOptions> & { size?: number }
}

export type CardstockProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> &
  Partial<CornersProps> &
  Partial<CssProp>

export const cardstock: (
  tag: HTMLTagName,
  props: CardstockProps
) => FC<CardstockProps> = (tag, { children, s, ...props }) => {
  const myCorners = isUndefined(props.corners)
    ? undefined
    : Array.isArray(props.corners)
    ? props.corners
    : [props.corners]
  const factory = isUndefined(myCorners)
    ? undefined
    : props.cornerOptions
    ? corners(...myCorners).options(props.cornerOptions)
    : corners(...myCorners).size(20)
  const Component = factory
    ? styled(factory[tag])`
        ${s}
      `
    : styled[tag]`
        ${s}
      `
  return memo(Component, (prev, next) => {
    const childrenEqual = prev.children === next.children
    const styleEqual = prev.style === next.style
    const cornersEqual = prev.corners === next.corners
    const cornerOptionsEqual = prev.cornerOptions === next.cornerOptions
    console.log({
      childrenEqual,
      styleEqual,
      cornersEqual,
      cornerOptionsEqual,
    })
    return childrenEqual && styleEqual && cornersEqual && cornerOptionsEqual
  })
  // return Component
}

export const Test: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Div corners={round} cornerOptions={{ size: 20 }}>
      {children}
    </Div>
  )
}

export const Div: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = useMemo(
    () => cardstock(`div`, props),
    [props.corners, props.cornerOptions, props.s]
  )
  return <Component {...props}>{children}</Component>
}

export const Span: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`span`, props)
  return <Component {...props}>{children}</Component>
}

export const Heading1: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`h1`, props)
  return <Component {...props}>{children}</Component>
}

export const Heading2: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`h2`, props)
  return <Component {...props}>{children}</Component>
}

export const H1 = Heading1
export const H2 = Heading2

export const OrderedList: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`ol`, props)
  return <Component {...props}>{children}</Component>
}

export const UnorderedList: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`ul`, props)
  return <Component {...props}>{children}</Component>
}

export const ListItem: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`li`, props)
  return <Component {...props}>{children}</Component>
}

export const Ol = OrderedList
export const Ul = UnorderedList
export const Li = ListItem

export const Paragraph: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`p`, props)
  return <Component {...props}>{children}</Component>
}

export const P = Paragraph

export const Button: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`button`, props)
  return <Component {...props}>{children}</Component>
}

export const Input: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`input`, props)
  return <Component {...props}>{children}</Component>
}

export const Label: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`label`, props)
  return <Component {...props}>{children}</Component>
}

export const Select: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`select`, props)
  return <Component {...props}>{children}</Component>
}

export const Option: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`option`, props)
  return <Component {...props}>{children}</Component>
}

export const Textarea: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`textarea`, props)
  return <Component {...props}>{children}</Component>
}

export const Table: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`table`, props)
  return <Component {...props}>{children}</Component>
}

export const TableBody: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`tbody`, props)
  return <Component {...props}>{children}</Component>
}

export const TableData: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`td`, props)
  return <Component {...props}>{children}</Component>
}

export const TableHead: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`thead`, props)
  return <Component {...props}>{children}</Component>
}

export const TableHeader: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`th`, props)
  return <Component {...props}>{children}</Component>
}

export const TableRow: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`tr`, props)
  return <Component {...props}>{children}</Component>
}

export const Td = TableData
export const Th = TableHeader
export const Tr = TableRow
export const Tbody = TableBody
export const Thead = TableHead

export const Italic: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`i`, props)
  return <Component {...props}>{children}</Component>
}

export const Bold: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`b`, props)
  return <Component {...props}>{children}</Component>
}

export const Underline: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`u`, props)
  return <Component {...props}>{children}</Component>
}

export const Strike: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`s`, props)
  return <Component {...props}>{children}</Component>
}

export const I = Italic
export const B = Bold
export const U = Underline
export const S = Strike

export const Article: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`article`, props)
  return <Component {...props}>{children}</Component>
}

export const Aside: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`aside`, props)
  return <Component {...props}>{children}</Component>
}

export const Footer: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`footer`, props)
  return <Component {...props}>{children}</Component>
}

export const Header: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`header`, props)
  return <Component {...props}>{children}</Component>
}

export const Svg: FC<CardstockProps> = ({ children, ...props }) => {
  const Component = cardstock(`svg`, props)
  return <Component {...props}>{children}</Component>
}

export const Text: FC<CardstockProps & SVGProps<any>> = ({
  children,
  ...props
}) => {
  const Component = cardstock(`text`, props)
  return <Component {...props}>{children}</Component>
}
