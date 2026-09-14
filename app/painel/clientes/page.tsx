'use client';
import styles from "./clientes.module.css";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export default function ClientesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = createClient();

        const [contactsResult, leadsResult] = await Promise.all([
          supabase
            .from('contacts')
            .select('id, name, phone, email, created_at')
            .order('created_at', { ascending: false }),
          supabase.from('leads').select('id, contact_id'),
        ]);

        if (contactsResult.error) throw contactsResult.error;
        if (leadsResult.error) throw leadsResult.error;

        const counts: Record<string, number> = {};
        for (const lead of leadsResult.data ?? []) {
          if (lead.contact_id) {
            counts[lead.contact_id] = (counts[lead.contact_id] || 0) + 1;
          }
        }

        setLeadCounts(counts);
        setContacts((contactsResult.data ?? []) as Contact[]);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.phone?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
  });

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Contatos</h1>
          <p className={styles.subtitle}>Gerencie as pessoas e empresas captadas pelos seus leads.</p>
        </div>
        <button className={styles.button} disabled title="Em breve">+ Novo Contato</button>
      </header>

      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar contato..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.message}>Carregando...</div>
      ) : error ? (
        <div className={styles.message}>Falha ao carregar os contatos. Tente novamente mais tarde.</div>
      ) : contacts.length === 0 ? (
        <div className={styles.message}>Nenhum contato cadastrado ainda.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Contato</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Leads</th>
                <th>Último cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td className={styles.companyName}>{contact.name}</td>
                  <td>{contact.phone?.trim() || 'Não informado'}</td>
                  <td>{contact.email?.trim() || 'Não informado'}</td>
                  <td>{leadCounts[contact.id] || 0}</td>
                  <td>{new Date(contact.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>Nenhum contato encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
