import styles from "./layout.module.css";
export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>LeadFlow</h2>

        <nav className={styles.nav}>
          <a href="/painel">Visão geral</a>
          <a href="/painel/leads">Leads</a>
          <a href="/painel/formularios">Formulários</a>
          <a href="/painel/clientes">Clientes</a>
          <a href="/painel/configuracoes">Configurações</a>
        </nav>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}