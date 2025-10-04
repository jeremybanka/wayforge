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
		<span className="codeblock" id="use-an-index-to-track-family-members" ref={myRef}>
			<header>use-an-index-to-track-family-members.tsx</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { atom, findState } from \"atom.io\"\nimport { useO } from \"atom.io/react\"\n\nimport { Point, xAtoms, yAtoms } from \"./declare-a-family\"\n\nexport const pointIndex = atom<string[]>({\n\tkey: `pointIndex`,\n\tdefault: [],\n})\n\nfunction AllPoints() {\n\tconst pointIds = useO(pointIndex)\n\treturn (\n\t\t<>\n\t\t\t{pointIds.map((pointId) => {\n\t\t\t\tconst xAtom = findState(xAtoms, pointId)\n\t\t\t\tconst yAtom = findState(yAtoms, pointId)\n\t\t\t\treturn <Point key={pointId} xState={xAtom} yState={yAtom} />\n\t\t\t})}\n\t\t</>\n\t)\n}\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
