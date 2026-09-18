/**
 * Naipes decorativos de fundo da lobby (só visual).
 */
import {
  RiPokerClubsFill,
  RiPokerDiamondsFill,
  RiPokerHeartsFill,
  RiPokerSpadesFill,
} from "react-icons/ri";
import styles from "./SuitWatermark.module.css";

function SuitWatermark() {
  return (
    <>
      <span className={`${styles.mark} ${styles.spade}`} aria-hidden>
        <RiPokerSpadesFill aria-hidden />
      </span>
      <span className={`${styles.mark} ${styles.heart}`} aria-hidden>
        <RiPokerHeartsFill aria-hidden />
      </span>
      <span className={`${styles.mark} ${styles.club}`} aria-hidden>
        <RiPokerClubsFill aria-hidden />
      </span>
      <span className={`${styles.mark} ${styles.diamond}`} aria-hidden>
        <RiPokerDiamondsFill aria-hidden />
      </span>
    </>
  );
}

export default SuitWatermark;
