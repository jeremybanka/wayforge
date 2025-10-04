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
		<span className="codeblock" id="get-and-set-a-selector" ref={myRef}>
			<header>get-and-set-a-selector.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { getState, setState } from \"atom.io\"\n\nimport { dividendState, divisorState, quotientState } from \"./declare-a-selector\"\n\ngetState(dividendState) // -> 0\ngetState(divisorState) // -> 2\ngetState(quotientState) // -> 0\n\nsetState(dividendState, 4)\n\ngetState(quotientState) // -> 2\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
