import { useState } from "react";
import styles from "./App.module.css";
import CreateGame from "./components/CreateGame";
import JoinGame from "./components/JoinGame";
import { IoClose } from "react-icons/io5";

function App() {
  const [modal, setModal] = useState<null | "create" | "join">(null);

  return (
    <div className={styles.lobby}>
      <header className={styles.lobby__header}>
        <h1 className={styles.lobby__brand}>Truco Online</h1>
        <p className={styles.lobby__subtitle}>Crie ou entre numa partida</p>
      </header>

      <div className={styles.lobby__actions}>
        <button
          className={`${styles.lobby__cta} ${styles["lobby__cta--primary"]}`}
          onClick={() => setModal("create")}
        >
          Criar Partida
        </button>
        <button
          className={`${styles.lobby__cta} ${styles["lobby__cta--secondary"]}`}
          onClick={() => setModal("join")}
        >
          Entrar em uma Partida
        </button>
      </div>

      {modal !== null && (
        <div
          className={styles.lobby__modalOverlay}
          onClick={() => setModal(null)}
        >
          <div
            className={styles.lobby__modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.lobby__modalClose}
              onClick={() => setModal(null)}
            >
              <IoClose />
            </button>
            {modal === "create" && <CreateGame />}
            {modal === "join" && <JoinGame />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
