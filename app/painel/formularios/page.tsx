import styles from "./formularios.module.css";

const forms = [
  {
    name: "Captação Geral",
    status: "Ativo",
    responses: 32,
    type: "Lead Gen",
  },
  {
    name: "Orçamento Detalhado",
    status: "Ativo",
    responses: 18,
    type: "Quote",
  },
  {
    name: "Campanha Instagram - Agosto",
    status: "Pausado",
    responses: 7,
    type: "Campaign",
  },
];

export default function FormulariosPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Formulários</h1>
          <p className={styles.subtitle}>Crie e gerencie seus formulários de captação.</p>
        </div>
        <button className={styles.button}>+ Novo Formulário</button>
      </header>

      <div className={styles.grid}>
        {forms.map((form, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.formName}>{form.name}</h3>
              <span className={`${styles.badge} ${form.status === 'Ativo' ? styles.active : styles.paused}`}>
                {form.status}
              </span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.stat}>
                <p className={styles.label}>Respostas</p>
                <strong className={styles.value}>{form.responses}</strong>
              </div>
              <div className={styles.stat}>
                <p className={styles.label}>Tipo</p>
                <strong className={styles.value}>{form.type}</strong>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <button className={styles.btnEdit}>Editar</button>
              <button className={styles.btnView}>Visualizar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
