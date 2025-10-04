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
		<span className="codeblock" id="use-a-family-in-a-transaction" ref={myRef}>
			<header>use-a-family-in-a-transaction.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { atom, atomFamily, transaction } from \"atom.io\"\n\nexport type PublicUser = {\n\tid: string\n\tdisplayName: string\n}\n\nexport const publicUserAtoms = atomFamily<PublicUser, string>({\n\tkey: `publicUser`,\n\tdefault: (id) => ({ id, displayName: `` }),\n})\n\nexport const userIndex = atom<string[]>({\n\tkey: `userIndex`,\n\tdefault: [],\n})\n\nexport const addUserTX = transaction<(user: PublicUser) => void>({\n\tkey: `addUser`,\n\tdo: ({ get, set }, user) => {\n\t\tset(publicUserAtoms, user.id, user)\n\t\tif (!get(userIndex).includes(user.id)) {\n\t\t\tset(userIndex, (current) => [...current, user.id])\n\t\t}\n\t},\n})\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
