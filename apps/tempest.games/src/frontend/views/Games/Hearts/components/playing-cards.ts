import TwoOfSpades from "./playing-cards/2♠.svg?url"
import TwoOfClubs from "./playing-cards/2♣.svg?url"
import TwoOfHearts from "./playing-cards/2♥.svg?url"
import TwoOfDiamonds from "./playing-cards/2♦.svg?url"
import ThreeOfSpades from "./playing-cards/3♠.svg?url"
import ThreeOfClubs from "./playing-cards/3♣.svg?url"
import ThreeOfHearts from "./playing-cards/3♥.svg?url"
import ThreeOfDiamonds from "./playing-cards/3♦.svg?url"
import FourOfSpades from "./playing-cards/4♠.svg?url"
import FourOfClubs from "./playing-cards/4♣.svg?url"
import FourOfHearts from "./playing-cards/4♥.svg?url"
import FourOfDiamonds from "./playing-cards/4♦.svg?url"
import FiveOfSpades from "./playing-cards/5♠.svg?url"
import FiveOfClubs from "./playing-cards/5♣.svg?url"
import FiveOfHearts from "./playing-cards/5♥.svg?url"
import FiveOfDiamonds from "./playing-cards/5♦.svg?url"
import SixOfSpades from "./playing-cards/6♠.svg?url"
import SixOfClubs from "./playing-cards/6♣.svg?url"
import SixOfHearts from "./playing-cards/6♥.svg?url"
import SixOfDiamonds from "./playing-cards/6♦.svg?url"
import SevenOfSpades from "./playing-cards/7♠.svg?url"
import SevenOfClubs from "./playing-cards/7♣.svg?url"
import SevenOfHearts from "./playing-cards/7♥.svg?url"
import SevenOfDiamonds from "./playing-cards/7♦.svg?url"
import EightOfSpades from "./playing-cards/8♠.svg?url"
import EightOfClubs from "./playing-cards/8♣.svg?url"
import EightOfHearts from "./playing-cards/8♥.svg?url"
import EightOfDiamonds from "./playing-cards/8♦.svg?url"
import NineOfSpades from "./playing-cards/9♠.svg?url"
import NineOfClubs from "./playing-cards/9♣.svg?url"
import NineOfHearts from "./playing-cards/9♥.svg?url"
import NineOfDiamonds from "./playing-cards/9♦.svg?url"
import TenOfSpades from "./playing-cards/10♠.svg?url"
import TenOfClubs from "./playing-cards/10♣.svg?url"
import TenOfHearts from "./playing-cards/10♥.svg?url"
import TenOfDiamonds from "./playing-cards/10♦.svg?url"
import AceOfSpades from "./playing-cards/A♠.svg?url"
import AceOfClubs from "./playing-cards/A♣.svg?url"
import AceOfHearts from "./playing-cards/A♥.svg?url"
import AceOfDiamonds from "./playing-cards/A♦.svg?url"
import Back from "./playing-cards/back.svg?url"
import JackOfSpades from "./playing-cards/J♠.svg?url"
import JackOfClubs from "./playing-cards/J♣.svg?url"
import JackOfHearts from "./playing-cards/J♥.svg?url"
import JackOfDiamonds from "./playing-cards/J♦.svg?url"
import KingOfSpades from "./playing-cards/K♠.svg?url"
import KingOfClubs from "./playing-cards/K♣.svg?url"
import KingOfHearts from "./playing-cards/K♥.svg?url"
import KingOfDiamonds from "./playing-cards/K♦.svg?url"
import QueenOfSpades from "./playing-cards/Q♠.svg?url"
import QueenOfClubs from "./playing-cards/Q♣.svg?url"
import QueenOfHearts from "./playing-cards/Q♥.svg?url"
import QueenOfDiamonds from "./playing-cards/Q♦.svg?url"

export const PLAYING_CARDS: Record<string, string> = {
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
} as const
