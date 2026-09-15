import styles from "./App.module.css";
import CreateGame from "./components/CreateGame";
import JoinGame from "./components/JoinGame";
import { FiPlus, FiKey, FiShield, FiZap, FiShare2 } from "react-icons/fi";
import { MdOutlineCampaign } from "react-icons/md";

function scrollToAcesso() {
  document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" });
}

function App() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCards} aria-hidden>
          <span className={`${styles.fakeCard} ${styles.fakeCardLeft}`}>
            7♥
          </span>
          <span className={`${styles.fakeCard} ${styles.fakeCardCenter}`}>
            ZAP
          </span>
          <span className={`${styles.fakeCard} ${styles.fakeCardRight}`}>
            4♣
          </span>
        </div>

        <p className={styles.eyebrow}>• Mesa clássica paulista & mineira •</p>
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
            Entrar na Partida
          </button>
        </div>

        <ul className={styles.heroPerks}>
          <li>
            <FiShield aria-hidden />
            Sem cadastro obrigatório
          </li>
          <li>
            <FiZap aria-hidden />
            Partidas rápidas de 12 tentos
          </li>
          <li>
            <MdOutlineCampaign aria-hidden />
            Gritos de Truco originais
          </li>
        </ul>
      </section>

      <section id="acesso" className={styles.access}>
        <div className={styles.accessHeader}>
          <div>
            <p className={styles.accessEyebrow}>Painel de acesso rápido</p>
            <h2 className={styles.accessTitle}>Partidas e Acesso</h2>
          </div>
          <span className={styles.badge}>Mesas com vagas abertas</span>
        </div>

        <div className={styles.accessGrid}>
          <CreateGame />
          <JoinGame />
        </div>
      </section>

      <section className={styles.features}>
        <article className={styles.featureCard}>
          <span className={styles.featureIcon}>40</span>
          <h3>Baralho Tradicional</h3>
          <p>Baralho limpo sem 8, 9 e 10. Pronto para o truco.</p>
        </article>
        <article className={styles.featureCard}>
          <span className={`${styles.featureIcon} ${styles.featureIconRed}`}>
            <MdOutlineCampaign aria-hidden />
          </span>
          <h3>Gritos e Truco</h3>
          <p>Peça Seis, Nove e Doze com efeitos sonoros imersivos.</p>
        </article>
        <article className={styles.featureCard}>
          <span className={`${styles.featureIcon} ${styles.featureIconGreen}`}>
            <FiShare2 aria-hidden />
          </span>
          <h3>Convite por Link</h3>
          <p>Envie direto no WhatsApp para seu amigo entrar na hora.</p>
        </article>
      </section>
    </div>
  );
}

export default App;
