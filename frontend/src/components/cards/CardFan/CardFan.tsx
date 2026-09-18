/**
 * Fan decorativo de cartas do hero (7♥, 4♣, A♠).
 */
import PlayingCard from "../PlayingCard";
import styles from "./CardFan.module.css";

function CardFan() {
  return (
    <div className={styles.fan} aria-hidden>
      <div className={styles.slotLeft}>
        <div className={styles.tiltLeft}>
          <PlayingCard rank="7" suit="hearts" />
        </div>
      </div>
      <div className={styles.slotRight}>
        <div className={styles.tiltRight}>
          <PlayingCard rank="A" suit="spades" />
        </div>
      </div>
      <div className={styles.slotCenter}>
        <PlayingCard rank="4" suit="clubs" />
      </div>
    </div>
  );
}

export default CardFan;
