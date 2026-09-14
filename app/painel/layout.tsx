'use client';

import styles from "./layout.module.css";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
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

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = useState('…');
  const [userRole, setUserRole] = useState('');
  const [initials, setInitials] = useState('…');
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [profileRes, membershipRes] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
          supabase.from('organization_members').select('role').eq('user_id', user.id).limit(1),
        ]);

        const name = profileRes.data?.full_name || user.email || 'Usuário';
        const role = membershipRes.data?.[0]?.role;

        setUserName(name);
        setUserRole(role ? ROLE_LABELS[role] ?? role : '');
        setInitials(getInitials(name));
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setUserLoaded(true);
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: "Visão geral", href: "/painel", icon: "📊" },
    { label: "Leads", href: "/painel/leads", icon: "👥" },
    { label: "Formulários", href: "/painel/formularios", icon: "📝" },
    { label: "Contatos", href: "/painel/clientes", icon: "🏢" },
    { label: "Configurações", href: "/painel/configuracoes", icon: "⚙️" },
  ];

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brandArea}>
          <div className={styles.logoIcon}>L</div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>LeadFlow</span>
            <span className={styles.logoSub}>CRM</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            const isActive = item.href === '/painel'
              ? pathname === '/painel'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.userArea}>
          <div className={styles.avatar}>{userLoaded ? initials : '…'}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>{userRole}</span>
          </div>
          <div className={styles.onlineIndicator} />
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Sair da conta"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
