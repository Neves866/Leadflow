import styles from './StatusBadge.module.css';

const STATUS_CLASS: Record<string, string> = {
  'Novo': styles.novo,
  'Qualificado': styles.qualificado,
  'Orçamento': styles.orcamento,
  'Negociação': styles.negociacao,
  'Fechado': styles.fechado,
};

export default function StatusBadge({ status }: { status: string }) {
  const toneClass = STATUS_CLASS[status] ?? styles.outro;
  return <span className={`${styles.badge} ${toneClass}`}>{status}</span>;
}