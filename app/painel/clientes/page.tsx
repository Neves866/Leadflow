import styles from "./clientes.module.css";

const clients = [
  {
    id: '1',
    name: 'Empresa Demo Ltda',
    plan: 'Premium',
    leads: 142,
    status: 'Ativo',
    email: 'contato@empreademo.com',
  },
  {
    id: '2',
    name: 'Climatiza Sul',
    plan: 'Basic',
    leads: 45,
    status: 'Ativo',
    email: 'admin@climatizasul.com',
  },
  {
    id: '3',
    name: 'Elétrica Express',
    plan: 'Professional',
    leads: 89,
    status: 'Inativo',
    email: 'financeiro@eletricaexpress.com',
  },
];

export default function ClientesPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Gestão de contas multiempresa.</p>
        </div>
        <button className={styles.button}>+ Nova Empresa</button>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plano</th>
              <th>Total Leads</th>
              <th>Status</th>
              <th>Contato</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td className={styles.companyName}>{client.name}</td>
                <td>{client.plan}</td>
                <td>{client.leads}</td>
                <td>
                  <span className={`${styles.badge} ${client.status === 'Ativo' ? styles.active : styles.inactive}`}>
                    {client.status}
                  </span>
                </td>
                <td>{client.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
