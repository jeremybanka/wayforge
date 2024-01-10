import TwoOfSpades from "wayfarer.quest/graphics/svg/playing-cards/2♠.svg?url"
import TwoOfClubs from "wayfarer.quest/graphics/svg/playing-cards/2♣.svg?url"
import TwoOfHearts from "wayfarer.quest/graphics/svg/playing-cards/2♥.svg?url"
import TwoOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/2♦.svg?url"
import ThreeOfSpades from "wayfarer.quest/graphics/svg/playing-cards/3♠.svg?url"
import ThreeOfClubs from "wayfarer.quest/graphics/svg/playing-cards/3♣.svg?url"
import ThreeOfHearts from "wayfarer.quest/graphics/svg/playing-cards/3♥.svg?url"
import ThreeOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/3♦.svg?url"
import FourOfSpades from "wayfarer.quest/graphics/svg/playing-cards/4♠.svg?url"
import FourOfClubs from "wayfarer.quest/graphics/svg/playing-cards/4♣.svg?url"
import FourOfHearts from "wayfarer.quest/graphics/svg/playing-cards/4♥.svg?url"
import FourOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/4♦.svg?url"
import FiveOfSpades from "wayfarer.quest/graphics/svg/playing-cards/5♠.svg?url"
import FiveOfClubs from "wayfarer.quest/graphics/svg/playing-cards/5♣.svg?url"
import FiveOfHearts from "wayfarer.quest/graphics/svg/playing-cards/5♥.svg?url"
import FiveOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/5♦.svg?url"
import SixOfSpades from "wayfarer.quest/graphics/svg/playing-cards/6♠.svg?url"
import SixOfClubs from "wayfarer.quest/graphics/svg/playing-cards/6♣.svg?url"
import SixOfHearts from "wayfarer.quest/graphics/svg/playing-cards/6♥.svg?url"
import SixOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/6♦.svg?url"
import SevenOfSpades from "wayfarer.quest/graphics/svg/playing-cards/7♠.svg?url"
import SevenOfClubs from "wayfarer.quest/graphics/svg/playing-cards/7♣.svg?url"
import SevenOfHearts from "wayfarer.quest/graphics/svg/playing-cards/7♥.svg?url"
import SevenOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/7♦.svg?url"
import EightOfSpades from "wayfarer.quest/graphics/svg/playing-cards/8♠.svg?url"
import EightOfClubs from "wayfarer.quest/graphics/svg/playing-cards/8♣.svg?url"
import EightOfHearts from "wayfarer.quest/graphics/svg/playing-cards/8♥.svg?url"
import EightOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/8♦.svg?url"
import NineOfSpades from "wayfarer.quest/graphics/svg/playing-cards/9♠.svg?url"
import NineOfClubs from "wayfarer.quest/graphics/svg/playing-cards/9♣.svg?url"
import NineOfHearts from "wayfarer.quest/graphics/svg/playing-cards/9♥.svg?url"
import NineOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/9♦.svg?url"
import TenOfSpades from "wayfarer.quest/graphics/svg/playing-cards/10♠.svg?url"
import TenOfClubs from "wayfarer.quest/graphics/svg/playing-cards/10♣.svg?url"
import TenOfHearts from "wayfarer.quest/graphics/svg/playing-cards/10♥.svg?url"
import TenOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/10♦.svg?url"
import AceOfSpades from "wayfarer.quest/graphics/svg/playing-cards/A♠.svg?url"
import AceOfClubs from "wayfarer.quest/graphics/svg/playing-cards/A♣.svg?url"
import AceOfHearts from "wayfarer.quest/graphics/svg/playing-cards/A♥.svg?url"
import AceOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/A♦.svg?url"
import JackOfSpades from "wayfarer.quest/graphics/svg/playing-cards/J♠.svg?url"
import JackOfClubs from "wayfarer.quest/graphics/svg/playing-cards/J♣.svg?url"
import JackOfHearts from "wayfarer.quest/graphics/svg/playing-cards/J♥.svg?url"
import JackOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/J♦.svg?url"
import KingOfSpades from "wayfarer.quest/graphics/svg/playing-cards/K♠.svg?url"
import KingOfClubs from "wayfarer.quest/graphics/svg/playing-cards/K♣.svg?url"
import KingOfHearts from "wayfarer.quest/graphics/svg/playing-cards/K♥.svg?url"
import KingOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/K♦.svg?url"
import QueenOfSpades from "wayfarer.quest/graphics/svg/playing-cards/Q♠.svg?url"
import QueenOfClubs from "wayfarer.quest/graphics/svg/playing-cards/Q♣.svg?url"
import QueenOfHearts from "wayfarer.quest/graphics/svg/playing-cards/Q♥.svg?url"
import QueenOfDiamonds from "wayfarer.quest/graphics/svg/playing-cards/Q♦.svg?url"
import Back from "wayfarer.quest/graphics/svg/playing-cards/back.svg?url"

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
