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
		<span className="codeblock" id="subscribe-to-a-timeline" ref={myRef}>
			<header>subscribe-to-a-timeline.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { setState, subscribe } from \"atom.io\"\n\nimport { xAtoms } from \"../families/declare-a-family\"\nimport { coordinatesTL } from \"./create-a-timeline\"\n\nsubscribe(coordinatesTL, (value) => {\n\tconsole.log(value)\n})\n\nsetState(xAtoms, `sample_key`, 1)\n/* {\n  newValue: 1,\n  oldValue: 0,\n  key: `sample_key`,\n  type: `atom_update`,\n  timestamp: 1629780000000,\n  family: {\n    key: `x`,\n    type: `atom_family`,\n  }\n} */\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
