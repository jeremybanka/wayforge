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
		<span className="codeblock" id="use-json" ref={myRef}>
			<header>use-json.tsx</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { mutableAtom } from \"atom.io\"\nimport { useJSON } from \"atom.io/react\"\nimport { UList } from \"atom.io/transceivers/u-list\"\n\nconst numbersCollectionState = mutableAtom<UList<string>>({\n\tkey: `numbersCollection::mutable`,\n\tclass: UList,\n})\n\nfunction Numbers() {\n\tconst numbers = useJSON(numbersCollectionState)\n\treturn (\n\t\t<>\n\t\t\t{numbers.map((n) => (\n\t\t\t\t<div key={n}>{n}</div>\n\t\t\t))}\n\t\t</>\n\t)\n}\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
