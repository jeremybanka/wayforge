/* eslint-disable import/order */
import type * as React from "react"
import { ReactComponent as Back } from "../assets/svg/playing-cards/back.svg"
import { ReactComponent as AceOfSpades } from "../assets/svg/playing-cards/A♠.svg"
import { ReactComponent as TwoOfSpades } from "../assets/svg/playing-cards/2♠.svg"
import { ReactComponent as ThreeOfSpades } from "../assets/svg/playing-cards/3♠.svg"
import { ReactComponent as FourOfSpades } from "../assets/svg/playing-cards/4♠.svg"
import { ReactComponent as FiveOfSpades } from "../assets/svg/playing-cards/5♠.svg"
import { ReactComponent as SixOfSpades } from "../assets/svg/playing-cards/6♠.svg"
import { ReactComponent as SevenOfSpades } from "../assets/svg/playing-cards/7♠.svg"
import { ReactComponent as EightOfSpades } from "../assets/svg/playing-cards/8♠.svg"
import { ReactComponent as NineOfSpades } from "../assets/svg/playing-cards/9♠.svg"
import { ReactComponent as TenOfSpades } from "../assets/svg/playing-cards/10♠.svg"
import { ReactComponent as JackOfSpades } from "../assets/svg/playing-cards/J♠.svg"
import { ReactComponent as QueenOfSpades } from "../assets/svg/playing-cards/Q♠.svg"
import { ReactComponent as KingOfSpades } from "../assets/svg/playing-cards/K♠.svg"
import { ReactComponent as AceOfHearts } from "../assets/svg/playing-cards/A♥.svg"
import { ReactComponent as TwoOfHearts } from "../assets/svg/playing-cards/2♥.svg"
import { ReactComponent as ThreeOfHearts } from "../assets/svg/playing-cards/3♥.svg"
import { ReactComponent as FourOfHearts } from "../assets/svg/playing-cards/4♥.svg"
import { ReactComponent as FiveOfHearts } from "../assets/svg/playing-cards/5♥.svg"
import { ReactComponent as SixOfHearts } from "../assets/svg/playing-cards/6♥.svg"
import { ReactComponent as SevenOfHearts } from "../assets/svg/playing-cards/7♥.svg"
import { ReactComponent as EightOfHearts } from "../assets/svg/playing-cards/8♥.svg"
import { ReactComponent as NineOfHearts } from "../assets/svg/playing-cards/9♥.svg"
import { ReactComponent as TenOfHearts } from "../assets/svg/playing-cards/10♥.svg"
import { ReactComponent as JackOfHearts } from "../assets/svg/playing-cards/J♥.svg"
import { ReactComponent as QueenOfHearts } from "../assets/svg/playing-cards/Q♥.svg"
import { ReactComponent as KingOfHearts } from "../assets/svg/playing-cards/K♥.svg"
import { ReactComponent as AceOfClubs } from "../assets/svg/playing-cards/A♣.svg"
import { ReactComponent as TwoOfClubs } from "../assets/svg/playing-cards/2♣.svg"
import { ReactComponent as ThreeOfClubs } from "../assets/svg/playing-cards/3♣.svg"
import { ReactComponent as FourOfClubs } from "../assets/svg/playing-cards/4♣.svg"
import { ReactComponent as FiveOfClubs } from "../assets/svg/playing-cards/5♣.svg"
import { ReactComponent as SixOfClubs } from "../assets/svg/playing-cards/6♣.svg"
import { ReactComponent as SevenOfClubs } from "../assets/svg/playing-cards/7♣.svg"
import { ReactComponent as EightOfClubs } from "../assets/svg/playing-cards/8♣.svg"
import { ReactComponent as NineOfClubs } from "../assets/svg/playing-cards/9♣.svg"
import { ReactComponent as TenOfClubs } from "../assets/svg/playing-cards/10♣.svg"
import { ReactComponent as JackOfClubs } from "../assets/svg/playing-cards/J♣.svg"
import { ReactComponent as QueenOfClubs } from "../assets/svg/playing-cards/Q♣.svg"
import { ReactComponent as KingOfClubs } from "../assets/svg/playing-cards/K♣.svg"
import { ReactComponent as AceOfDiamonds } from "../assets/svg/playing-cards/A♦.svg"
import { ReactComponent as TwoOfDiamonds } from "../assets/svg/playing-cards/2♦.svg"
import { ReactComponent as ThreeOfDiamonds } from "../assets/svg/playing-cards/3♦.svg"
import { ReactComponent as FourOfDiamonds } from "../assets/svg/playing-cards/4♦.svg"
import { ReactComponent as FiveOfDiamonds } from "../assets/svg/playing-cards/5♦.svg"
import { ReactComponent as SixOfDiamonds } from "../assets/svg/playing-cards/6♦.svg"
import { ReactComponent as SevenOfDiamonds } from "../assets/svg/playing-cards/7♦.svg"
import { ReactComponent as EightOfDiamonds } from "../assets/svg/playing-cards/8♦.svg"
import { ReactComponent as NineOfDiamonds } from "../assets/svg/playing-cards/9♦.svg"
import { ReactComponent as TenOfDiamonds } from "../assets/svg/playing-cards/10♦.svg"
import { ReactComponent as JackOfDiamonds } from "../assets/svg/playing-cards/J♦.svg"
import { ReactComponent as QueenOfDiamonds } from "../assets/svg/playing-cards/Q♦.svg"
import { ReactComponent as KingOfDiamonds } from "../assets/svg/playing-cards/K♦.svg"
/* eslint-enable import/order */

export const PlayingCards: Record<string, React.FC> = {
	Back,
	"A♠": AceOfSpades,
	"2♠": TwoOfSpades,
	"3♠": ThreeOfSpades,
	"4♠": FourOfSpades,
	"5♠": FiveOfSpades,
	"6♠": SixOfSpades,
	"7♠": SevenOfSpades,
	"8♠": EightOfSpades,
	"9♠": NineOfSpades,
	"10♠": TenOfSpades,
	"J♠": JackOfSpades,
	"Q♠": QueenOfSpades,
	"K♠": KingOfSpades,
	"A♥": AceOfHearts,
	"2♥": TwoOfHearts,
	"3♥": ThreeOfHearts,
	"4♥": FourOfHearts,
	"5♥": FiveOfHearts,
	"6♥": SixOfHearts,
	"7♥": SevenOfHearts,
	"8♥": EightOfHearts,
	"9♥": NineOfHearts,
	"10♥": TenOfHearts,
	"J♥": JackOfHearts,
	"Q♥": QueenOfHearts,
	"K♥": KingOfHearts,
	"A♣": AceOfClubs,
	"2♣": TwoOfClubs,
	"3♣": ThreeOfClubs,
	"4♣": FourOfClubs,
	"5♣": FiveOfClubs,
	"6♣": SixOfClubs,
	"7♣": SevenOfClubs,
	"8♣": EightOfClubs,
	"9♣": NineOfClubs,
	"10♣": TenOfClubs,
	"J♣": JackOfClubs,
	"Q♣": QueenOfClubs,
	"K♣": KingOfClubs,
	"A♦": AceOfDiamonds,
	"2♦": TwoOfDiamonds,
	"3♦": ThreeOfDiamonds,
	"4♦": FourOfDiamonds,
	"5♦": FiveOfDiamonds,
	"6♦": SixOfDiamonds,
	"7♦": SevenOfDiamonds,
	"8♦": EightOfDiamonds,
	"9♦": NineOfDiamonds,
	"10♦": TenOfDiamonds,
	"J♦": JackOfDiamonds,
	"Q♦": QueenOfDiamonds,
	"K♦": KingOfDiamonds,
}
