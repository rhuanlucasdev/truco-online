import type { IconType } from "react-icons";
import {
  RiPokerClubsFill,
  RiPokerDiamondsFill,
  RiPokerHeartsFill,
  RiPokerSpadesFill,
} from "react-icons/ri";
import styles from "./PlayingCard.module.css";

export type Suit = "hearts" | "diamonds" | "spades" | "clubs";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "J" | "Q" | "K";

type PipSlot = "tl" | "tc" | "tr" | "ml" | "c" | "mr" | "bl" | "bc" | "br";

type PlayingCardProps = {
  rank: Rank;
  suit: Suit;
  className?: string;
};

const SUIT_ICON: Record<Suit, IconType> = {
  hearts: RiPokerHeartsFill,
  diamonds: RiPokerDiamondsFill,
  spades: RiPokerSpadesFill,
  clubs: RiPokerClubsFill,
};

const RED_SUITS = new Set<Suit>(["hearts", "diamonds"]);
const FACE_RANKS = new Set<Rank>(["J", "Q", "K"]);

const PIP_SLOT_CLASS: Record<PipSlot, string> = {
  tl: styles.pipTl,
  tc: styles.pipTc,
  tr: styles.pipTr,
  ml: styles.pipMl,
  c: styles.pipC,
  mr: styles.pipMr,
  bl: styles.pipBl,
  bc: styles.pipBc,
  br: styles.pipBr,
};

const PIP_LAYOUTS: Record<number, PipSlot[]> = {
  1: ["c"],
  2: ["tl", "br"],
  3: ["tc", "c", "bc"],
  4: ["tl", "tr", "bl", "br"],
  5: ["tl", "tr", "c", "bl", "br"],
  6: ["tl", "tr", "ml", "mr", "bl", "br"],
  7: ["tl", "tr", "ml", "c", "mr", "bl", "br"],
};

function pipCount(rank: Rank): number {
  if (rank === "A") return 1;
  const n = Number(rank);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function Corner({
  rank,
  suit,
  colorClass,
}: {
  rank: Rank;
  suit: Suit;
  colorClass: string;
}) {
  const SuitIcon = SUIT_ICON[suit];

  return (
    <div className={`${styles.corner} ${colorClass}`}>
      <span className={styles.rank}>{rank}</span>
      <span className={styles.suit}>
        <SuitIcon aria-hidden />
      </span>
    </div>
  );
}

function CardCenter({
  rank,
  suit,
  colorClass,
}: {
  rank: Rank;
  suit: Suit;
  colorClass: string;
}) {
  const SuitIcon = SUIT_ICON[suit];
  const isFace = FACE_RANKS.has(rank);
  const slots = PIP_LAYOUTS[pipCount(rank)] ?? PIP_LAYOUTS[1];

  return (
    <div className={styles.center}>
      {isFace ? (
        <span className={`${styles.centerFace} ${colorClass}`}>{rank}</span>
      ) : (
        <div className={`${styles.pips} ${colorClass}`}>
          {slots.map((slot) => (
            <SuitIcon
              key={slot}
              aria-hidden
              className={`${styles.pip} ${PIP_SLOT_CLASS[slot]}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayingCard({ rank, suit, className = "" }: PlayingCardProps) {
  const colorClass = RED_SUITS.has(suit) ? styles.red : styles.black;

  return (
    <div className={`${styles.card} ${className}`} aria-hidden>
      <Corner rank={rank} suit={suit} colorClass={colorClass} />
      <CardCenter rank={rank} suit={suit} colorClass={colorClass} />
      <div className={styles.cornerBottom}>
        <Corner rank={rank} suit={suit} colorClass={colorClass} />
      </div>
    </div>
  );
}

export default PlayingCard;
