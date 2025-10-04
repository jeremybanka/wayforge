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
		<span className="codeblock" id="an-atom-token-is-a-reference" ref={myRef}>
			<header>an-atom-token-is-a-reference.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { getState } from \"atom.io\"\n\nimport { countState } from \"./declare-an-atom\"\n\ncountState // -> { key: `count`, type: `atom` }\ngetState(countState) // -> 0\ngetState({ key: `count`, type: `atom` }) // -> 0\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
