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
		<span className="codeblock" id="try-catch-a-failed-transaction" ref={myRef}>
			<header>try-catch-a-failed-transaction.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import type { Loadable } from \"atom.io\"\nimport { atom, atomFamily, runTransaction, transaction } from \"atom.io\"\n\nexport type GameItems = { coins: number }\nexport type Inventory = Partial<Readonly<GameItems>>\n\nexport const myIdState = atom<Loadable<string>>({\n\tkey: `myId`,\n\tdefault: async () => {\n\t\tconst response = await fetch(`https://io.fyi/api/myId`)\n\t\tconst { id } = await response.json()\n\t\treturn id\n\t},\n})\n\nexport const playerInventoryAtoms = atomFamily<Inventory, string>({\n\tkey: `inventory`,\n\tdefault: {},\n})\n\nexport const giveCoinsTX = transaction<\n\t(playerId: string, amount: number) => Promise<void>\n>({\n\tkey: `giveCoins`,\n\tdo: async ({ get, set }, playerId, amount) => {\n\t\tconst myId = await get(myIdState)\n\t\tconst myInventory = get(playerInventoryAtoms, myId)\n\t\tif (!myInventory.coins) {\n\t\t\tthrow new Error(`Your inventory is missing coins`)\n\t\t}\n\t\tconst myCoins = myInventory.coins\n\t\tif (myCoins < amount) {\n\t\t\tthrow new Error(`You don't have enough coins`)\n\t\t}\n\t\tconst theirInventory = get(playerInventoryAtoms, playerId)\n\t\tconst theirCoins = theirInventory.coins ?? 0\n\t\tset(playerInventoryAtoms, myId, (previous) => ({\n\t\t\t...previous,\n\t\t\tcoins: myCoins - amount,\n\t\t}))\n\t\tset(playerInventoryAtoms, playerId, (previous) => ({\n\t\t\t...previous,\n\t\t\tcoins: theirCoins + amount,\n\t\t}))\n\t},\n})\n;async () => {\n\ttry {\n\t\tawait runTransaction(giveCoinsTX)(`playerId`, 3)\n\t} catch (thrown) {\n\t\tif (thrown instanceof Error) {\n\t\t\talert(thrown.message)\n\t\t}\n\t}\n}\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
