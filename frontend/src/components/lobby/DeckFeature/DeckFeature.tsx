/** Card informativo do baralho de 40 cartas (truco). */
import styles from "./DeckFeature.module.css";

function DeckFeature() {
  return (
    <section className={styles.section}>
      <article className={styles.card}>
        <span className={styles.deckIcon} aria-hidden>
          <span>40</span>
          <span>Cartas</span>
        </span>
        <div>
          <h3>Baralho Tradicional</h3>
          <p>Baralho limpo sem 8, 9 e 10. Pronto para o truco.</p>
        </div>
      </article>
    </section>
  );
}

export default DeckFeature;
