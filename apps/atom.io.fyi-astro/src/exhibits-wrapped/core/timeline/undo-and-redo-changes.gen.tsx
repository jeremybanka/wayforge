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
		<span className="codeblock" id="undo-and-redo-changes" ref={myRef}>
			<header>undo-and-redo-changes.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { getState, redo, setState, subscribe, undo } from \"atom.io\"\n\nimport { xAtoms } from \"../families/declare-a-family\"\nimport { coordinatesTL } from \"./create-a-timeline\"\n\nsubscribe(coordinatesTL, (value) => {\n\tconsole.log(value)\n})\n\nsetState(xAtoms, `sample_key`, 1)\ngetState(xAtoms, `sample_key`) // 1\nsetState(xAtoms, `sample_key`, 2)\ngetState(xAtoms, `sample_key`) // 2\nundo(coordinatesTL)\ngetState(xAtoms, `sample_key`) // 1\nredo(coordinatesTL)\ngetState(xAtoms, `sample_key`) // 2\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
