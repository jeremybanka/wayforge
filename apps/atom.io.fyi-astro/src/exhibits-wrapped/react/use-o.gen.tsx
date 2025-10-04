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
		<span className="codeblock" id="use-o" ref={myRef}>
			<header>use-o.tsx</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { atom } from \"atom.io\"\nimport { useO } from \"atom.io/react\"\n\nfunction discoverUrl() {\n\treturn new URL(window.location.href)\n}\nconst urlState = atom<string>({\n\tkey: `url`,\n\tdefault: () => discoverUrl().toString(),\n\teffects: [\n\t\t({ setSelf }) => {\n\t\t\twindow.addEventListener(`popstate`, () => {\n\t\t\t\tsetSelf(discoverUrl().toString())\n\t\t\t})\n\t\t},\n\t],\n})\n\nfunction UrlDisplay() {\n\tconst url = useO(urlState)\n\treturn <div>{url}</div>\n}\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
