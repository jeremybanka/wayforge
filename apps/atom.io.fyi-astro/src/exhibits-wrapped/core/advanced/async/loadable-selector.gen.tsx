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
		<span className="codeblock" id="loadable-selector" ref={myRef}>
			<header>loadable-selector.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import type { Loadable } from \"atom.io\"\nimport { atom, selector } from \"atom.io\"\n\nfunction discoverCoinId() {\n\tconst urlParams = new URLSearchParams(window.location.search)\n\treturn urlParams.get(`coinId`) ?? `bitcoin`\n}\nexport const coinIdState = atom<string>({\n\tkey: `coinId`,\n\tdefault: discoverCoinId,\n\teffects: [\n\t\t({ setSelf }) => {\n\t\t\twindow.addEventListener(`popstate`, () => {\n\t\t\t\tsetSelf(discoverCoinId())\n\t\t\t})\n\t\t},\n\t],\n})\n\nexport const findCoinPriceState = selector<Loadable<number>>({\n\tkey: `coinPrice`,\n\tget: async ({ get }) => {\n\t\tconst coinId = get(coinIdState)\n\t\tconst response = await fetch(\n\t\t\t`https://api.coingecko.com/api/v3/coins/${coinId}`,\n\t\t)\n\t\tconst json = await response.json()\n\t\treturn json.market_data.current_price.usd\n\t},\n})\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
