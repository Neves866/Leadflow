'use client';

import styles from "./layout.module.css";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "Visão geral", href: "/painel", icon: "📊" },
    { label: "Leads", href: "/painel/leads", icon: "👥" },
    { label: "Formulários", href: "/painel/formularios", icon: "📝" },
    { label: "Clientes", href: "/painel/clientes", icon: "🏢" },
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
          <div className={styles.avatar}>CN</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Conta Demo</span>
            <span className={styles.userRole}>Administrador</span>
          </div>
          <div className={styles.onlineIndicator} />
        </div>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
