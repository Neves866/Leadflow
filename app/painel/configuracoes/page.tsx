'use client';

import styles from "./configuracoes.module.css";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  suspended: 'Suspensa',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface OrgInfo {
  name: string;
  slug: string;
  status: string;
}

interface TeamMember {
  userId: string;
  name: string;
  role: string;
}

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Usuário não autenticado');

        setUserId(user.id);

        const [profileRes, membershipRes] = await Promise.all([
          supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
          supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).limit(1),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (membershipRes.error) throw membershipRes.error;

        setFullName(profileRes.data?.full_name || '');
        setPhone(profileRes.data?.phone || '');

        const organizationId = membershipRes.data?.[0]?.organization_id;

        if (organizationId) {
          const [orgRes, membersRes] = await Promise.all([
            supabase.from('organizations').select('name, slug, status').eq('id', organizationId).maybeSingle(),
            supabase
              .from('organization_members')
              .select('user_id, role, created_at')
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: true }),
          ]);

          if (orgRes.error) throw orgRes.error;
          if (membersRes.error) throw membersRes.error;

          if (orgRes.data) setOrg(orgRes.data as OrgInfo);

          const userIds = (membersRes.data ?? []).map(member => member.user_id);

          if (userIds.length > 0) {
            const profilesRes = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds);

            if (profilesRes.error) throw profilesRes.error;

            const profileNames = new Map(
              (profilesRes.data ?? []).map(profile => [profile.id, profile.full_name])
            );

            setTeam(
              (membersRes.data ?? []).map(member => ({
                userId: member.user_id,
                name: profileNames.get(member.user_id) || 'Usuário',
                role: ROLE_LABELS[member.role] ?? member.role,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    setSaveFeedback(null);
    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSaveFeedback({ ok: true, text: 'Perfil salvo com sucesso.' });
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveFeedback({ ok: false, text: 'Falha ao salvar o perfil.' });
    } finally {
      setSaving(false);
    }
  };

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
            <input type="text" value={org?.name ?? ''} readOnly />
          </div>
          <div className={styles.field}>
            <label>Slug</label>
            <input type="text" value={org?.slug ?? ''} readOnly />
          </div>
          <div className={styles.field}>
            <label>Status</label>
            <input type="text" value={org ? STATUS_LABELS[org.status] ?? org.status : ''} readOnly />
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>👥 Equipe</h2>
          <div className={styles.userList}>
            {team.length === 0 ? (
              <p className={styles.toggleDesc}>Nenhum membro encontrado.</p>
            ) : (
              team.map(member => (
                <div key={member.userId} className={styles.userItem}>
                  <div className={styles.avatar}>{getInitials(member.name)}</div>
                  <div>
                    <p className={styles.toggleLabel}>{member.name}</p>
                    <p className={styles.toggleDesc}>{member.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>👤 Meu Perfil</h2>
          <div className={styles.field}>
            <label>Nome</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className={styles.field}>
            <label>Telefone</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Seu telefone"
            />
          </div>
          <div className={styles.saveRow}>
            <button className={styles.saveButton} onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            {saveFeedback && (
              <span className={saveFeedback.ok ? styles.saveFeedbackOk : styles.saveFeedbackError}>
                {saveFeedback.text}
              </span>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🔔 Notificações</h2>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Em breve</span>
              <span className={styles.toggleDesc}>As preferências de notificações serão configuradas aqui.</span>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🔌 Integrações</h2>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>WhatsApp</span>
            </div>
            <span className={styles.badgeSoon}>Em breve</span>
          </div>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Google</span>
            </div>
            <span className={styles.badgeSoon}>Em breve</span>
          </div>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Meta</span>
            </div>
            <span className={styles.badgeSoon}>Em breve</span>
          </div>
        </section>
      </div>
    </main>
  );
}
