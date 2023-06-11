export const setCssVars = (
  vars: Record<`--${string}`, number | string>
): Partial<React.CSSProperties> => vars as any
