'use client';

import styles from './configuracoes.module.css';
import { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  PlugZap,
  Save,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

  if (loading) {
    return <main className={styles.container}><div className={styles.stateMessage}>Carregando configurações...</div></main>;
  }

  if (error) {
    return <main className={styles.container}><div className={styles.stateMessage}>Não foi possível carregar as configurações.</div></main>;
  }

  return (
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>WORKSPACE</span>
          <h1>Configurações</h1>
          <p>Identidade, equipe e preferências operacionais do seu LeadFlow.</p>
        </div>
        <span className={styles.workspaceBadge}><Settings2 size={15} /> Central de controle</span>
      </header>

      <section className={styles.workspaceHero}>
        <div className={styles.workspaceMark}><Building2 size={21} /></div>
        <div className={styles.workspaceCopy}>
          <span>WORKSPACE ATUAL</span>
          <strong>{org?.name || 'LeadFlow'}</strong>
          <small>/{org?.slug || 'workspace'}</small>
        </div>
        <div className={styles.workspaceStatus}>
          <span className={org?.status === 'active' ? styles.statusDotActive : styles.statusDot} />
          {org ? STATUS_LABELS[org.status] ?? org.status : '—'}
        </div>
      </section>

      <div className={styles.configGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBox}><UserRound size={18} /></span>
            <div><span>PERFIL</span><h2>Minha conta</h2></div>
          </div>

          <div className={styles.profilePreview}>
            <div className={styles.profileAvatar}>{getInitials(fullName || 'U')}</div>
            <div><strong>{fullName || 'Seu nome'}</strong><span>Perfil pessoal no workspace</span></div>
          </div>

          <div className={styles.field}>
            <label>Nome</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className={styles.field}>
            <label>Telefone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Seu telefone" />
          </div>

          <div className={styles.saveRow}>
            <button className={styles.saveButton} onClick={handleSaveProfile} disabled={saving}>
              <Save size={15} />
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
            {saveFeedback && (
              <span className={saveFeedback.ok ? styles.saveFeedbackOk : styles.saveFeedbackError}>{saveFeedback.text}</span>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBox}><Building2 size={18} /></span>
            <div><span>ORGANIZAÇÃO</span><h2>Empresa</h2></div>
          </div>
          <div className={styles.readOnlyGrid}>
            <div><span>Nome</span><strong>{org?.name || '—'}</strong></div>
            <div><span>Slug</span><strong>{org?.slug || '—'}</strong></div>
            <div><span>Status</span><strong>{org ? STATUS_LABELS[org.status] ?? org.status : '—'}</strong></div>
          </div>
          <div className={styles.infoNote}><ShieldCheck size={15} /> Dados estruturais da organização são protegidos pelo workspace.</div>
        </section>

        <section className={`${styles.card} ${styles.teamCard}`}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBox}><UsersRound size={18} /></span>
            <div><span>ACESSO</span><h2>Equipe</h2></div>
            <span className={styles.memberCount}>{team.length}</span>
          </div>

          <div className={styles.userList}>
            {team.length === 0 ? (
              <div className={styles.emptyInline}>Nenhum membro encontrado.</div>
            ) : team.map(member => (
              <div key={member.userId} className={styles.userItem}>
                <div className={styles.avatar}>{getInitials(member.name)}</div>
                <div className={styles.userCopy}>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
                <span className={styles.accessBadge}>Ativo</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBox}><PlugZap size={18} /></span>
            <div><span>ECOSSISTEMA</span><h2>Integrações</h2></div>
          </div>
          <div className={styles.integrationList}>
            {['WhatsApp', 'Google', 'Meta'].map(item => (
              <div key={item} className={styles.integrationItem}>
                <div><span className={styles.integrationDot} /><strong>{item}</strong></div>
                <span className={styles.badgeSoon}>Em breve</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBox}><Bell size={18} /></span>
            <div><span>COMUNICAÇÃO</span><h2>Notificações</h2></div>
          </div>
          <div className={styles.comingSoonPanel}>
            <Bell size={20} />
            <strong>Central de alertas</strong>
            <span>Preferências de notificações, lembretes e eventos comerciais serão configuradas aqui.</span>
            <small>Em breve</small>
          </div>
        </section>
      </div>
    </main>
  );
}
