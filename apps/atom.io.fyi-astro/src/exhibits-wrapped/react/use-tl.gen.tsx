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
		<span className="codeblock" id="use-tl" ref={myRef}>
			<header>use-tl.tsx</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { useTL } from \"atom.io/react\"\n\nimport { coordinatesTL } from \"../core/timeline/create-a-timeline\"\n\nexport function UrlDisplay() {\n\tconst { at, length, undo, redo } = useTL(coordinatesTL)\n\treturn (\n\t\t<>\n\t\t\t<div>{at}</div>\n\t\t\t<div>{length}</div>\n\t\t\t<button type=\"button\" onClick={undo}>\n\t\t\t\tundo\n\t\t\t</button>\n\t\t\t<button type=\"button\" onClick={redo}>\n\t\t\t\tredo\n\t\t\t</button>\n\t\t</>\n\t)\n}\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
