import styles from "./leads.module.css";
import { MOCK_LEADS } from "@/lib/mocks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState(MOCK_LEADS);

  useEffect(() => {
    const localLeads = JSON.parse(localStorage.getItem('leadflow_leads') || '[]');
    if (localLeads.length > 0) {
      setLeads([...localLeads, ...MOCK_LEADS]);
    }
  }, []);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Leads</h1>
          <p className={styles.subtitle}>Gerencie todas as oportunidades recebidas.</p>
        </div>

        <button className={styles.button}>+ Novo lead</button>
      </header>

      <div className={styles.filters}>
        <input type="text" className={styles.searchInput} placeholder="Buscar lead..." />

        <select className={styles.statusFilter}>
          <option>Todos os status</option>
          <option>Novo</option>
          <option>Qualificado</option>
          <option>Orçamento</option>
          <option>Negociação</option>
          <option>Fechado</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Valor potencial</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={styles.tableRow}
                onClick={() => router.push(`/painel/leads/${lead.id}`)}
              >
                <td className={styles.clientName}>{lead.nome}</td>
                <td>{lead.servico}</td>
                <td>{lead.origem}</td>
                <td>
                  <span className={styles.statusBadge}>{lead.status}</span>
                </td>
                <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valorPotencial)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}


