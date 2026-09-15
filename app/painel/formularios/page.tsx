'use client';

import styles from './formularios.module.css';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  FileText,
  Link2,
  MessageSquareText,
  Plus,
  Radio,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FormCard {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
}

export default function FormulariosPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormCard[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = createClient();

        const [formsResult, submissionsResult] = await Promise.all([
          supabase
            .from('forms')
            .select('id, name, slug, active, created_at')
            .order('created_at', { ascending: false }),
          supabase.from('form_submissions').select('id, form_id'),
        ]);

        if (formsResult.error) throw formsResult.error;
        if (submissionsResult.error) throw submissionsResult.error;

        const counts: Record<string, number> = {};
        for (const submission of submissionsResult.data ?? []) {
          if (submission.form_id) counts[submission.form_id] = (counts[submission.form_id] || 0) + 1;
        }

        setResponseCounts(counts);
        setForms((formsResult.data ?? []) as FormCard[]);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const summary = useMemo(() => ({
    total: forms.length,
    active: forms.filter(form => form.active).length,
    responses: Object.values(responseCounts).reduce((sum, count) => sum + count, 0),
  }), [forms, responseCounts]);

  return (
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>CAPTAÇÃO</span>
          <h1>Formulários</h1>
          <p>Seus pontos de entrada para novas oportunidades no LeadFlow.</p>
        </div>
        <button className={styles.newButton} disabled title="Em breve">
          <Plus size={16} />
          Novo formulário
        </button>
      </header>

      <section className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryIcon}><FileText size={17} /></span>
          <div><small>Formulários</small><strong>{summary.total}</strong></div>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryIcon}><Radio size={17} /></span>
          <div><small>Ativos</small><strong>{summary.active}</strong></div>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryIcon}><MessageSquareText size={17} /></span>
          <div><small>Respostas recebidas</small><strong>{summary.responses}</strong></div>
        </div>
      </section>

      {loading ? (
        <div className={styles.message}>Carregando formulários...</div>
      ) : error ? (
        <div className={styles.message}>Falha ao carregar os formulários. Tente novamente mais tarde.</div>
      ) : forms.length === 0 ? (
        <div className={styles.message}>Nenhum formulário cadastrado ainda.</div>
      ) : (
        <div className={styles.grid}>
          {forms.map(form => (
            <article key={form.id} className={styles.card}>
              <div className={styles.cardAccent} />
              <div className={styles.cardTop}>
                <span className={styles.formIcon}><FileText size={18} /></span>
                <span className={`${styles.statusBadge} ${form.active ? styles.active : styles.paused}`}>
                  <span />
                  {form.active ? 'Ativo' : 'Pausado'}
                </span>
              </div>

              <div className={styles.cardTitleBlock}>
                <h2>{form.name}</h2>
                <span>Criado em {new Date(form.created_at).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className={styles.formMetrics}>
                <div>
                  <span>Respostas</span>
                  <strong>{responseCounts[form.id] || 0}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{form.active ? 'Captando' : 'Pausado'}</strong>
                </div>
              </div>

              <div className={styles.linkBox}>
                <Link2 size={14} />
                <code>/f/{form.slug}</code>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.secondaryButton} disabled title="Em breve">Editar</button>
                <button className={styles.primaryButton} onClick={() => router.push(`/f/${form.slug}`)}>
                  Visualizar
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
