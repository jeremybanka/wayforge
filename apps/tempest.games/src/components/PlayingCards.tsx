import TwoOfSpades from "src/graphics/svg/playing-cards/2♠.svg?url"
import TwoOfClubs from "src/graphics/svg/playing-cards/2♣.svg?url"
import TwoOfHearts from "src/graphics/svg/playing-cards/2♥.svg?url"
import TwoOfDiamonds from "src/graphics/svg/playing-cards/2♦.svg?url"
import ThreeOfSpades from "src/graphics/svg/playing-cards/3♠.svg?url"
import ThreeOfClubs from "src/graphics/svg/playing-cards/3♣.svg?url"
import ThreeOfHearts from "src/graphics/svg/playing-cards/3♥.svg?url"
import ThreeOfDiamonds from "src/graphics/svg/playing-cards/3♦.svg?url"
import FourOfSpades from "src/graphics/svg/playing-cards/4♠.svg?url"
import FourOfClubs from "src/graphics/svg/playing-cards/4♣.svg?url"
import FourOfHearts from "src/graphics/svg/playing-cards/4♥.svg?url"
import FourOfDiamonds from "src/graphics/svg/playing-cards/4♦.svg?url"
import FiveOfSpades from "src/graphics/svg/playing-cards/5♠.svg?url"
import FiveOfClubs from "src/graphics/svg/playing-cards/5♣.svg?url"
import FiveOfHearts from "src/graphics/svg/playing-cards/5♥.svg?url"
import FiveOfDiamonds from "src/graphics/svg/playing-cards/5♦.svg?url"
import SixOfSpades from "src/graphics/svg/playing-cards/6♠.svg?url"
import SixOfClubs from "src/graphics/svg/playing-cards/6♣.svg?url"
import SixOfHearts from "src/graphics/svg/playing-cards/6♥.svg?url"
import SixOfDiamonds from "src/graphics/svg/playing-cards/6♦.svg?url"
import SevenOfSpades from "src/graphics/svg/playing-cards/7♠.svg?url"
import SevenOfClubs from "src/graphics/svg/playing-cards/7♣.svg?url"
import SevenOfHearts from "src/graphics/svg/playing-cards/7♥.svg?url"
import SevenOfDiamonds from "src/graphics/svg/playing-cards/7♦.svg?url"
import EightOfSpades from "src/graphics/svg/playing-cards/8♠.svg?url"
import EightOfClubs from "src/graphics/svg/playing-cards/8♣.svg?url"
import EightOfHearts from "src/graphics/svg/playing-cards/8♥.svg?url"
import EightOfDiamonds from "src/graphics/svg/playing-cards/8♦.svg?url"
import NineOfSpades from "src/graphics/svg/playing-cards/9♠.svg?url"
import NineOfClubs from "src/graphics/svg/playing-cards/9♣.svg?url"
import NineOfHearts from "src/graphics/svg/playing-cards/9♥.svg?url"
import NineOfDiamonds from "src/graphics/svg/playing-cards/9♦.svg?url"
import TenOfSpades from "src/graphics/svg/playing-cards/10♠.svg?url"
import TenOfClubs from "src/graphics/svg/playing-cards/10♣.svg?url"
import TenOfHearts from "src/graphics/svg/playing-cards/10♥.svg?url"
import TenOfDiamonds from "src/graphics/svg/playing-cards/10♦.svg?url"
import AceOfSpades from "src/graphics/svg/playing-cards/A♠.svg?url"
import AceOfClubs from "src/graphics/svg/playing-cards/A♣.svg?url"
import AceOfHearts from "src/graphics/svg/playing-cards/A♥.svg?url"
import AceOfDiamonds from "src/graphics/svg/playing-cards/A♦.svg?url"
import JackOfSpades from "src/graphics/svg/playing-cards/J♠.svg?url"
import JackOfClubs from "src/graphics/svg/playing-cards/J♣.svg?url"
import JackOfHearts from "src/graphics/svg/playing-cards/J♥.svg?url"
import JackOfDiamonds from "src/graphics/svg/playing-cards/J♦.svg?url"
import KingOfSpades from "src/graphics/svg/playing-cards/K♠.svg?url"
import KingOfClubs from "src/graphics/svg/playing-cards/K♣.svg?url"
import KingOfHearts from "src/graphics/svg/playing-cards/K♥.svg?url"
import KingOfDiamonds from "src/graphics/svg/playing-cards/K♦.svg?url"
import QueenOfSpades from "src/graphics/svg/playing-cards/Q♠.svg?url"
import QueenOfClubs from "src/graphics/svg/playing-cards/Q♣.svg?url"
import QueenOfHearts from "src/graphics/svg/playing-cards/Q♥.svg?url"
import QueenOfDiamonds from "src/graphics/svg/playing-cards/Q♦.svg?url"
import Back from "src/graphics/svg/playing-cards/back.svg?url"

export const PlayingCards: Record<string, SvgUrlData> = {
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
