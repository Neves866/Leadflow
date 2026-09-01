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
    { label: "Visão geral", href: "/painel" },
    { label: "Leads", href: "/painel/leads" },
    { label: "Formulários", href: "/painel/formularios" },
    { label: "Clientes", href: "/painel/clientes" },
    { label: "Configurações", href: "/painel/configuracoes" },
  ];

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>LeadFlow</h2>

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
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
