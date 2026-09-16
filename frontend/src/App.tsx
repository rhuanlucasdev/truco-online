import {
  RiPokerClubsFill,
  RiPokerDiamondsFill,
  RiPokerHeartsFill,
  RiPokerSpadesFill,
} from "react-icons/ri";
import styles from "./App.module.css";
import { CardFan } from "./components/cards";
import { CreateGame, JoinGame } from "./components/lobby";
import { FiPlus, FiKey, FiShield, FiZap, FiShare2 } from "react-icons/fi";
import { MdOutlineCampaign } from "react-icons/md";

function scrollToAcesso() {
  document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" });
}

function App() {
  return (
    <div className={styles.page}>
      <span className={`${styles.watermark} ${styles.watermarkSpade}`} aria-hidden>
        <RiPokerSpadesFill aria-hidden />
      </span>
      <span className={`${styles.watermark} ${styles.watermarkHeart}`} aria-hidden>
        <RiPokerHeartsFill aria-hidden />
      </span>
      <span className={`${styles.watermark} ${styles.watermarkClub}`} aria-hidden>
        <RiPokerClubsFill aria-hidden />
      </span>
      <span className={`${styles.watermark} ${styles.watermarkDiamond}`} aria-hidden>
        <RiPokerDiamondsFill aria-hidden />
      </span>

      <section className={styles.hero}>
        <div className={styles.felt} aria-hidden />
        <div className={styles.heroInner}>
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

          <div className={styles.heroActions}>
            <button
              type="button"
              className={`${styles.cta} ${styles.ctaPrimary}`}
              onClick={scrollToAcesso}
            >
              <FiPlus aria-hidden />
              Criar Partida
            </button>
            <button
              type="button"
              className={`${styles.cta} ${styles.ctaSecondary}`}
              onClick={scrollToAcesso}
            >
              <FiKey aria-hidden />
              <span className={styles.ctaSecondaryLabel}>
                Entrar na
                <br />
                Partida
              </span>
            </button>
          </div>

          <ul className={styles.heroPerks}>
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

      <section id="acesso" className={styles.access}>
        <div className={styles.accessHeader}>
          <div>
            <p className={styles.accessEyebrow}>Painel de acesso rápido</p>
            <h2 className={styles.accessTitle}>Partidas e Acesso</h2>
          </div>
          <span className={`${styles.badge} ${styles.badgeSoon}`}>
            <span className={styles.badgeDot} aria-hidden />
            Mesas com vagas abertas
            <span className={styles.soonBadge}>Em breve</span>
          </span>
        </div>

        <div className={styles.accessGrid}>
          <CreateGame />
          <JoinGame />
        </div>
      </section>

      <section className={styles.features}>
        <article className={styles.featureCard}>
          <span className={styles.featureDeck} aria-hidden>
            <span>40</span>
            <span>Cartas</span>
          </span>
          <div>
            <h3>Baralho Tradicional</h3>
            <p>Baralho limpo sem 8, 9 e 10. Pronto para o truco.</p>
          </div>
        </article>
        <article className={`${styles.featureCard} ${styles.featureSoon}`}>
          <span className={`${styles.featureIcon} ${styles.featureIconRed}`}>
            <MdOutlineCampaign aria-hidden />
          </span>
          <div>
            <h3>
              Gritos e Truco
              <span className={styles.soonBadge}>Em breve</span>
            </h3>
            <p>Peça Seis, Nove e Doze com efeitos sonoros imersivos.</p>
          </div>
        </article>
        <article className={`${styles.featureCard} ${styles.featureSoon}`}>
          <span className={`${styles.featureIcon} ${styles.featureIconGreen}`}>
            <FiShare2 aria-hidden />
          </span>
          <div>
            <h3>
              Convite por Link
              <span className={styles.soonBadge}>Em breve</span>
            </h3>
            <p>Envie direto no WhatsApp para seu amigo entrar na hora.</p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default App;
