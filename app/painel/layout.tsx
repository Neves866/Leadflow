'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ContactRound,
  FileText,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Bell,
  Search,
  Menu,
} from 'lucide-react';
import QuickNavigator from '@/components/panel/QuickNavigator';
import { createClient } from '@/lib/supabase/client';
import styles from "./layout.module.css";

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Visão geral', href: '/painel', icon: LayoutDashboard },
      { label: 'Leads', href: '/painel/leads', icon: BriefcaseBusiness },
      { label: 'Contatos', href: '/painel/clientes', icon: ContactRound },
    ],
  },
  {
    label: 'Captação',
    items: [
      { label: 'Formulários', href: '/painel/formularios', icon: FileText },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Configurações', href: '/painel/configuracoes', icon: Settings },
    ],
  },
];

const SECTION_LABELS: [string, string][] = [
  ['/painel/leads/novo', 'Novo lead'],
  ['/painel/leads', 'Leads'],
  ['/painel/clientes', 'Contatos'],
  ['/painel/formularios', 'Formulários'],
  ['/painel/configuracoes', 'Configurações'],
  ['/painel', 'Visão geral'],
];

function getSectionLabel(pathname: string): string {
  for (const [prefix, label] of SECTION_LABELS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return label;
    }
  }
  return 'Visão geral';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
};

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  const [userName, setUserName] = useState('…');
  const [userRole, setUserRole] = useState('');
  const [initials, setInitials] = useState('…');
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('lf_sidebar_collapsed') === '1') {
        setCollapsed(true);
      }
    } catch {
      /* localStorage indisponível — segue expandido */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQuickNavOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('lf_sidebar_collapsed', next ? '1' : '0');
      } catch {
        /* segue sem persistir */
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const sectionLabel = getSectionLabel(pathname);

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.brandArea}>
          <div className={styles.logoIcon}>LF</div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoName}>LeadFlow</span>
              <span className={styles.logoSub}>CRM</span>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} className={styles.navGroup}>
              {!collapsed && <p className={styles.navGroupLabel}>{group.label}</p>}
              {group.items.map(item => {
                const isActive = item.href === '/painel'
                  ? pathname === '/painel'
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} strokeWidth={1.8} className={styles.navIcon} />
                    {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.userArea}>
          <div className={styles.avatar}>{userLoaded ? initials : '…'}</div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userRole}>{userRole}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Sair da conta"
            aria-label="Sair da conta"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <span className={styles.crumbRoot}>LeadFlow</span>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbCurrent}>{sectionLabel}</span>
          </div>

          <div className={styles.topbarRight}>
            <button
              type="button"
              className={styles.quickNavButton}
              onClick={() => setQuickNavOpen(true)}
            >
              <Search size={15} />
              <span>Buscar ou ir para...</span>
              <kbd>Ctrl K</kbd>
            </button>

            <button
              type="button"
              className={styles.newLeadButton}
              onClick={() => router.push('/painel/leads/novo')}
            >
              <Plus size={16} />
              <span>Novo Lead</span>
            </button>

            <span className={styles.bellButton} title="Notificações em breve">
              <Bell size={17} />
            </span>

            <span className={styles.topbarAvatar}>{userLoaded ? initials : '…'}</span>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>

      <button
        type="button"
        className={styles.collapseToggle}
        onClick={toggleSidebar}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMobileOpen(false)}
          role="presentation"
        />
      )}

      <QuickNavigator open={quickNavOpen} onClose={() => setQuickNavOpen(false)} />
    </div>
  );
}