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
		<span className="codeblock" id="iterate-through-an-index-changing-the-value-of-some-atoms" ref={myRef}>
			<header>iterate-through-an-index-changing-the-value-of-some-atoms.ts</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{"import { atom, atomFamily, selectorFamily, transaction } from \"atom.io\"\n\nexport const nowState = atom<number>({\n\tkey: `now`,\n\tdefault: Date.now(),\n\teffects: [\n\t\t({ setSelf }) => {\n\t\t\tconst interval = setInterval(() => {\n\t\t\t\tsetSelf(Date.now())\n\t\t\t}, 1000)\n\t\t\treturn () => {\n\t\t\t\tclearInterval(interval)\n\t\t\t}\n\t\t},\n\t],\n})\n\nexport const timerIndex = atom<string[]>({\n\tkey: `timerIndex`,\n\tdefault: [],\n})\n\nexport const findTimerStartedState = atomFamily<number, string>({\n\tkey: `timerStarted`,\n\tdefault: 0,\n})\nexport const findTimerLengthState = atomFamily<number, string>({\n\tkey: `timerLength`,\n\tdefault: 60_000,\n})\nconst findTimerRemainingState = selectorFamily<number, string>({\n\tkey: `timerRemaining`,\n\tget:\n\t\t(id) =>\n\t\t({ get }) => {\n\t\t\tconst now = get(nowState)\n\t\t\tconst started = get(findTimerStartedState, id)\n\t\t\tconst length = get(findTimerLengthState, id)\n\t\t\treturn Math.max(0, length - (now - started))\n\t\t},\n})\n\nexport const addOneMinuteToAllRunningTimersTX = transaction({\n\tkey: `addOneMinuteToAllRunningTimers`,\n\tdo: ({ get, set }) => {\n\t\tconst timerIds = get(timerIndex)\n\t\tfor (const timerId of timerIds) {\n\t\t\tif (get(findTimerRemainingState, timerId) > 0) {\n\t\t\t\tset(findTimerLengthState, timerId, (current) => current + 60_000)\n\t\t\t}\n\t\t}\n\t},\n})\n"}
			</SyntaxHighlighter>
		</span>
	);
};

export default Codeblock;
