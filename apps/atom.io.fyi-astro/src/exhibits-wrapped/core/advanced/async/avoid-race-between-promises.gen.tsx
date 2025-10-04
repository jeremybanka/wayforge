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
		<span className="codeblock" id="avoid-race-between-promises" ref={myRef}>
			<header>avoid-race-between-promises.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import type { Loadable } from \"atom.io\"\nimport { atom, getState, setState } from \"atom.io\"\n\nexport const nameState = atom<Loadable<string>>({\n\tkey: `name`,\n\tdefault: ``,\n})\n// resolve in 2 seconds\nsetState(\n\tnameState,\n\tnew Promise<string>((resolve) =>\n\t\tsetTimeout(() => {\n\t\t\tresolve(`one`)\n\t\t}, 2000),\n\t),\n)\n// resolve in 1 second\nsetState(\n\tnameState,\n\tnew Promise<string>((resolve) =>\n\t\tsetTimeout(() => {\n\t\t\tresolve(`two`)\n\t\t}, 1000),\n\t),\n)\n// \"two\" resolves first\n// promise for \"one\" is set to be ignored\n// \"one\" resolves, but is ignored\nawait new Promise((resolve) => setTimeout(resolve, 3000))\nvoid getState(nameState) // \"two\"\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
