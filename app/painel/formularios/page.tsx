'use client';

import styles from "./formularios.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
          if (submission.form_id) {
            counts[submission.form_id] = (counts[submission.form_id] || 0) + 1;
          }
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

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Formulários</h1>
          <p className={styles.subtitle}>Crie e gerencie seus formulários de captação.</p>
        </div>
        <button className={styles.button} disabled title="Em breve">+ Novo Formulário</button>
      </header>

      {loading ? (
        <div className={styles.message}>Carregando...</div>
      ) : error ? (
        <div className={styles.message}>Falha ao carregar os formulários. Tente novamente mais tarde.</div>
      ) : forms.length === 0 ? (
        <div className={styles.message}>Nenhum formulário cadastrado ainda.</div>
      ) : (
        <div className={styles.grid}>
          {forms.map((form) => (
            <div key={form.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.formName}>{form.name}</h3>
                <span className={`${styles.badge} ${form.active ? styles.active : styles.paused}`}>
                  {form.active ? 'Ativo' : 'Pausado'}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.stat}>
                  <p className={styles.label}>Respostas</p>
                  <strong className={styles.value}>{responseCounts[form.id] || 0}</strong>
                </div>
                <div className={styles.stat}>
                  <p className={styles.label}>Link</p>
                  <strong className={styles.value}>/f/{form.slug}</strong>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.btnEdit} disabled title="Em breve">Editar</button>
                <button className={styles.btnView} onClick={() => router.push(`/f/${form.slug}`)}>Visualizar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
