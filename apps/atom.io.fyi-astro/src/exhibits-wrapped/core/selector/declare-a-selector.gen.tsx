/* eslint-disable quotes */
import * as React from 'react';
import type { VNode } from 'preact';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const Codeblock = (): VNode => {
	const myRef = React.useRef<HTMLSpanElement>(null);
	React.useEffect(() => {
		const me = myRef.current;
		if (me === null) {
			return;
		}
		const myElementsWithClassNameStringAndContainingDoubleQuotes = 
			Array.prototype.filter.call(
				me.querySelectorAll('.token.string'),
				(element: any) => element.textContent.includes('./')
			);
		for (const element of myElementsWithClassNameStringAndContainingDoubleQuotes) {
			// get everything following the final '/'
			const href = "#" + element.textContent.split('/').pop();
			element.innerHTML = `<a href="${href}">${element.textContent}</a>`;
		}
	}, [myRef.current]);
	return (
		<span className="codeblock" id="declare-a-selector" ref={myRef}>
			<header>declare-a-selector.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { atom, selector } from \"atom.io\"\n\nexport const dividendState = atom<number>({\n\tkey: `dividend`,\n\tdefault: 0,\n})\n\nexport const divisorState = atom<number>({\n\tkey: `divisor`,\n\tdefault: 2,\n})\n\nexport const quotientState = selector<number>({\n\tkey: `quotient`,\n\tget: ({ get }) => {\n\t\tconst dividend = get(dividendState)\n\t\tconst divisor = get(divisorState)\n\t\treturn dividend / divisor\n\t},\n})\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
