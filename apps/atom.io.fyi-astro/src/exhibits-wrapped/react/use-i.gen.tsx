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
		<span className="codeblock" id="use-i" ref={myRef}>
			<header>use-i.tsx</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { atom } from \"atom.io\"\nimport { useI, useO } from \"atom.io/react\"\n\nconst toggleState = atom<boolean>({\n\tkey: `toggle`,\n\tdefault: false,\n})\n\nfunction UrlDisplay() {\n\tconst setToggle = useI(toggleState)\n\tconst toggle = useO(toggleState)\n\treturn (\n\t\t<input\n\t\t\ttype=\"checkbox\"\n\t\t\tchecked={toggle}\n\t\t\tonChange={() => {\n\t\t\t\tsetToggle((t) => !t)\n\t\t\t}}\n\t\t/>\n\t)\n}\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
