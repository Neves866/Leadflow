'use client';

import styles from './clientes.module.css';
import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  Phone,
  Plus,
  Search,
  UsersRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
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
          if (lead.contact_id) counts[lead.contact_id] = (counts[lead.contact_id] || 0) + 1;
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

  const totals = useMemo(() => ({
    contacts: contacts.length,
    opportunities: Object.values(leadCounts).reduce((sum, count) => sum + count, 0),
    reachable: contacts.filter(contact => contact.phone || contact.email).length,
  }), [contacts, leadCounts]);

  return (
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>RELACIONAMENTO</span>
          <h1>Contatos</h1>
          <p>Uma visão organizada das pessoas que já entraram no seu funil comercial.</p>
        </div>
        <button className={styles.newButton} disabled title="Em breve">
          <Plus size={16} />
          Novo contato
        </button>
      </header>

      <section className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryIcon}><UsersRound size={17} /></span>
          <div><small>Contatos</small><strong>{totals.contacts}</strong></div>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryIcon}><BriefcaseBusiness size={17} /></span>
          <div><small>Oportunidades vinculadas</small><strong>{totals.opportunities}</strong></div>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryIcon}><Phone size={17} /></span>
          <div><small>Com canal de contato</small><strong>{totals.reachable}</strong></div>
        </div>
      </section>

      <section className={styles.dataPanel}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <span className={styles.resultCount}>{filteredContacts.length} resultado(s)</span>
        </div>

        {loading ? (
          <div className={styles.message}>Carregando contatos...</div>
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
                  <th>Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => (
                  <tr key={contact.id}>
                    <td>
                      <div className={styles.contactCell}>
                        <span className={styles.avatar}>{getInitials(contact.name)}</span>
                        <div>
                          <strong>{contact.name}</strong>
                          <small>ID {contact.id.slice(0, 8)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.cellWithIcon}><Phone size={14} />{contact.phone?.trim() || 'Não informado'}</span>
                    </td>
                    <td>
                      <span className={styles.cellWithIcon}><Mail size={14} />{contact.email?.trim() || 'Não informado'}</span>
                    </td>
                    <td><span className={styles.countPill}>{leadCounts[contact.id] || 0}</span></td>
                    <td>
                      <span className={styles.cellWithIcon}><CalendarDays size={14} />{new Date(contact.created_at).toLocaleDateString('pt-BR')}</span>
                    </td>
                  </tr>
                ))}
                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>Nenhum contato encontrado para esta busca.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
