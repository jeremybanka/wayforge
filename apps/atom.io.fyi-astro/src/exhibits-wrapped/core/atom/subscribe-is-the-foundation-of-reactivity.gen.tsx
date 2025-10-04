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
		<span className="codeblock" id="subscribe-is-the-foundation-of-reactivity" ref={myRef}>
			<header>subscribe-is-the-foundation-of-reactivity.tsx</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { useO } from \"atom.io/react\"\n\nimport { countState } from \"./declare-an-atom\"\n\nfunction Component() {\n\tconst count = useO(countState)\n\treturn <>{count}</>\n}\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
