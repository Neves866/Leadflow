import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.badge}>🚀 Disponível para demonstração</span>
        <h1 className={styles.title}>LeadFlow</h1>
        <p className={styles.subtitle}>
          Transforme interesse em oportunidades de venda. Capte, organize e acompanhe <br className="hidden sm:block" />
          suas oportunidades em um único fluxo inteligente.
        </p>

        <div className={styles.ctaGroup}>
          <Link href="/formulario/demo" className={styles.btnPrimary}>
            Simular captação
          </Link>
          <Link href="/painel" className={styles.btnSecondary}>
            Abrir dashboard
          </Link>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🎯</span>
            <h3 className={styles.featureTitle}>Captação Inteligente</h3>
            <p className={styles.featureDesc}>Formulários otimizados para converter visitantes em leads qualificados.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📈</span>
            <h3 className={styles.featureTitle}>Pipeline Comercial</h3>
            <p className={styles.featureDesc}>Acompanhe cada etapa da negociação, do primeiro contato ao fechamento.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>⚡</span>
            <h3 className={styles.featureTitle}>Métricas em Tempo Real</h3>
            <p className={styles.featureDesc}>Visualize a saúde do seu funil com KPIs claros e atualizados.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
