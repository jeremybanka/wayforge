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
		<span className="codeblock" id="declare-a-family" ref={myRef}>
			<header>declare-a-family.tsx</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import type { RegularAtomToken } from \"atom.io\"\nimport { atomFamily, getState } from \"atom.io\"\nimport { useO } from \"atom.io/react\"\nimport * as React from \"react\"\n\nexport const xAtoms = atomFamily<number, string>({\n\tkey: `x`,\n\tdefault: 0,\n})\nexport const yAtoms = atomFamily<number, string>({\n\tkey: `y`,\n\tdefault: 0,\n})\n\ngetState(xAtoms, `example`) // -> 0\n\nexport function Point(props: {\n\txState: RegularAtomToken<number>\n\tyState: RegularAtomToken<number>\n}) {\n\tconst x = useO(props.xState)\n\tconst y = useO(props.yState)\n\n\treturn <div className=\"point\" style={{ left: x, top: y }} />\n}\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
