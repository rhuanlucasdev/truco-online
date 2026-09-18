/**
 * Hero da lobby: marca, CTAs e perks.
 * Os botões só levam o usuário até o painel de create/join.
 */
import { FiPlus, FiKey, FiShield, FiZap } from "react-icons/fi";
import { CardFan } from "../../cards";
import { scrollToId } from "../../../utils/scrollToId";
import styles from "./Hero.module.css";

const ACCESS_SECTION_ID = "acesso";

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.felt} aria-hidden />

      <div className={styles.inner}>
        <CardFan />

        <div className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden />
          <p>Mesa clássica paulista & mineira</p>
          <span className={styles.dot} aria-hidden />
        </div>

        <h1 className={styles.brand}>Truco Online</h1>
        <p className={styles.tagline}>
          Chame seu parceiro. Embaralhe as cartas. E peça truco.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.cta} ${styles.ctaPrimary}`}
            onClick={() => scrollToId(ACCESS_SECTION_ID)}
          >
            <FiPlus aria-hidden />
            Criar Partida
          </button>
          <button
            type="button"
            className={`${styles.cta} ${styles.ctaSecondary}`}
            onClick={() => scrollToId(ACCESS_SECTION_ID)}
          >
            <FiKey aria-hidden />
            Entrar na Partida
          </button>
        </div>

        <ul className={styles.perks}>
          <li>
            <FiShield aria-hidden />
            Sem cadastro obrigatório
          </li>
          <li className={styles.perkDot} aria-hidden>
            •
          </li>
          <li>
            <FiZap aria-hidden />
            Partidas rápidas de 12 tentos
          </li>
        </ul>
      </div>
    </section>
  );
}

export default Hero;
