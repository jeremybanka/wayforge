import type * as React from "react"
import TwoOfSpades from "../assets/svg/playing-cards/2♠.svg?react"
import TwoOfClubs from "../assets/svg/playing-cards/2♣.svg?react"
import TwoOfHearts from "../assets/svg/playing-cards/2♥.svg?react"
import TwoOfDiamonds from "../assets/svg/playing-cards/2♦.svg?react"
import ThreeOfSpades from "../assets/svg/playing-cards/3♠.svg?react"
import ThreeOfClubs from "../assets/svg/playing-cards/3♣.svg?react"
import ThreeOfHearts from "../assets/svg/playing-cards/3♥.svg?react"
import ThreeOfDiamonds from "../assets/svg/playing-cards/3♦.svg?react"
import FourOfSpades from "../assets/svg/playing-cards/4♠.svg?react"
import FourOfClubs from "../assets/svg/playing-cards/4♣.svg?react"
import FourOfHearts from "../assets/svg/playing-cards/4♥.svg?react"
import FourOfDiamonds from "../assets/svg/playing-cards/4♦.svg?react"
import FiveOfSpades from "../assets/svg/playing-cards/5♠.svg?react"
import FiveOfClubs from "../assets/svg/playing-cards/5♣.svg?react"
import FiveOfHearts from "../assets/svg/playing-cards/5♥.svg?react"
import FiveOfDiamonds from "../assets/svg/playing-cards/5♦.svg?react"
import SixOfSpades from "../assets/svg/playing-cards/6♠.svg?react"
import SixOfClubs from "../assets/svg/playing-cards/6♣.svg?react"
import SixOfHearts from "../assets/svg/playing-cards/6♥.svg?react"
import SixOfDiamonds from "../assets/svg/playing-cards/6♦.svg?react"
import SevenOfSpades from "../assets/svg/playing-cards/7♠.svg?react"
import SevenOfClubs from "../assets/svg/playing-cards/7♣.svg?react"
import SevenOfHearts from "../assets/svg/playing-cards/7♥.svg?react"
import SevenOfDiamonds from "../assets/svg/playing-cards/7♦.svg?react"
import EightOfSpades from "../assets/svg/playing-cards/8♠.svg?react"
import EightOfClubs from "../assets/svg/playing-cards/8♣.svg?react"
import EightOfHearts from "../assets/svg/playing-cards/8♥.svg?react"
import EightOfDiamonds from "../assets/svg/playing-cards/8♦.svg?react"
import NineOfSpades from "../assets/svg/playing-cards/9♠.svg?react"
import NineOfClubs from "../assets/svg/playing-cards/9♣.svg?react"
import NineOfHearts from "../assets/svg/playing-cards/9♥.svg?react"
import NineOfDiamonds from "../assets/svg/playing-cards/9♦.svg?react"
import TenOfSpades from "../assets/svg/playing-cards/10♠.svg?react"
import TenOfClubs from "../assets/svg/playing-cards/10♣.svg?react"
import TenOfHearts from "../assets/svg/playing-cards/10♥.svg?react"
import TenOfDiamonds from "../assets/svg/playing-cards/10♦.svg?react"
import AceOfSpades from "../assets/svg/playing-cards/A♠.svg?react"
import AceOfClubs from "../assets/svg/playing-cards/A♣.svg?react"
import AceOfHearts from "../assets/svg/playing-cards/A♥.svg?react"
import AceOfDiamonds from "../assets/svg/playing-cards/A♦.svg?react"
import JackOfSpades from "../assets/svg/playing-cards/J♠.svg?react"
import JackOfClubs from "../assets/svg/playing-cards/J♣.svg?react"
import JackOfHearts from "../assets/svg/playing-cards/J♥.svg?react"
import JackOfDiamonds from "../assets/svg/playing-cards/J♦.svg?react"
import KingOfSpades from "../assets/svg/playing-cards/K♠.svg?react"
import KingOfClubs from "../assets/svg/playing-cards/K♣.svg?react"
import KingOfHearts from "../assets/svg/playing-cards/K♥.svg?react"
import KingOfDiamonds from "../assets/svg/playing-cards/K♦.svg?react"
import QueenOfSpades from "../assets/svg/playing-cards/Q♠.svg?react"
import QueenOfClubs from "../assets/svg/playing-cards/Q♣.svg?react"
import QueenOfHearts from "../assets/svg/playing-cards/Q♥.svg?react"
import QueenOfDiamonds from "../assets/svg/playing-cards/Q♦.svg?react"
import Back from "../assets/svg/playing-cards/back.svg?react"

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
