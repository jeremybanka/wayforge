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
		<span className="codeblock" id="create-a-timeline" ref={myRef}>
			<header>create-a-timeline.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { timeline } from \"atom.io\"\n\nimport { xAtoms, yAtoms } from \"../families/declare-a-family\"\n\nexport const coordinatesTL = timeline({\n\tkey: `timeline`,\n\tscope: [xAtoms, yAtoms],\n})\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
