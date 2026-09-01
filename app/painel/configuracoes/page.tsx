'use client';

import styles from "./configuracoes.module.css";

export default function ConfiguracoesPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Configurações</h1>
        <p className={styles.subtitle}>Personalize a operação do seu LeadFlow.</p>
      </header>

      <div className={styles.configGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🏢 Empresa</h2>
          <div className={styles.field}>
            <label>Nome da Empresa</label>
            <input type="text" defaultValue="Iluminar LeadFlow" />
          </div>
          <div className={styles.field}>
            <label>Cor Principal</label>
            <input type="color" defaultValue="#6366f1" />
          </div>
          <div className={styles.field}>
            <label>Logo</label>
            <div className={styles.avatar} style={{ width: '100px', height: '100px', borderRadius: '12px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              LOGO
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>👥 Equipe</h2>
          <div className={styles.userList}>
            <div className={styles.userItem}>
              <div className={styles.avatar}>AD</div>
              <div>
                <p className={styles.toggleLabel}>Admin Demo</p>
                <p className={styles.toggleDesc}>Administrador</p>
              </div>
            </div>
            <div className={styles.userItem}>
              <div className={styles.avatar}>UC</div>
              <div>
                <p className={styles.toggleLabel}>User Comercial</p>
                <p className={styles.toggleDesc}>Vendedor</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🔔 Notificações</h2>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Novos Leads</span>
              <span className={styles.toggleDesc}>Receber e-mail ao captar novo lead.</span>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" defaultChecked />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Alertas de Urgência</span>
              <span className={styles.toggleDesc}>Notificar leads com urgência 'Alta'.</span>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" defaultChecked />
              <span className={styles.slider}></span>
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🔌 Integrações</h2>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>WhatsApp API</span>
              <span className={styles.toggleDesc}>Conectar conta oficial Business.</span>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Google Sheets</span>
              <span className={styles.toggleDesc}>Sincronizar leads automaticamente.</span>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" defaultChecked />
              <span className={styles.slider}></span>
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}
