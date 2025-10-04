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
		<span className="codeblock" id="await-your-state" ref={myRef}>
			<header>await-your-state.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import http from \"node:http\"\n\nimport type { Loadable } from \"atom.io\"\nimport { atom, getState } from \"atom.io\"\n\nconst server = http.createServer((req, res) => {\n\tlet data: Uint8Array[] = []\n\treq\n\t\t.on(`data`, (chunk) => data.push(chunk))\n\t\t.on(`end`, () => {\n\t\t\tres.writeHead(200, { \"Content-Type\": `text/plain` })\n\t\t\tres.end(`The best way to predict the future is to invent it.`)\n\t\t\tdata = []\n\t\t})\n})\nserver.listen(3000)\n\nexport const quoteState = atom<Loadable<Error | string>>({\n\tkey: `quote`,\n\tdefault: async () => {\n\t\ttry {\n\t\t\tconst response = await fetch(`http://localhost:3000`)\n\t\t\treturn await response.text()\n\t\t} catch (thrown) {\n\t\t\tif (thrown instanceof Error) {\n\t\t\t\treturn thrown\n\t\t\t}\n\t\t\tthrow thrown\n\t\t}\n\t},\n})\n\nvoid getState(quoteState) // Promise { <pending> }\nawait getState(quoteState) // \"The best way to predict the future is to invent it.\"\nvoid getState(quoteState) // \"The best way to predict the future is to invent it.\"\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
