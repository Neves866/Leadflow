'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ContactRound,
  FileText,
  Settings,
  Plus,
  CornerDownLeft,
  Search,
} from 'lucide-react';
import styles from './QuickNavigator.module.css';

const ITEMS = [
  { label: 'Visão geral', href: '/painel', icon: LayoutDashboard },
  { label: 'Leads', href: '/painel/leads', icon: BriefcaseBusiness },
  { label: 'Novo Lead', href: '/painel/leads/novo', icon: Plus },
  { label: 'Contatos', href: '/painel/clientes', icon: ContactRound },
  { label: 'Formulários', href: '/painel/formularios', icon: FileText },
  { label: 'Configurações', href: '/painel/configuracoes', icon: Settings },
];

interface QuickNavigatorProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickNavigator({ open, onClose }: QuickNavigatorProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ITEMS;
    return ITEMS.filter(item => item.label.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelected(prev => Math.min(prev + 1, results.length - 1));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelected(prev => Math.max(prev - 1, 0));
        return;
      }

      if (event.key === 'Enter' && results[selected]) {
        event.preventDefault();
        router.push(results[selected].href);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selected, router, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={onClose} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Navegação rápida"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className={styles.searchRow}>
          <Search size={16} className={styles.searchIcon} />
          <input
            autoFocus
            className={styles.input}
            placeholder="Ir para..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelected(0);
            }}
          />
          <kbd className={styles.kbd}>ESC</kbd>
        </div>

        <div className={styles.results}>
          {results.length === 0 ? (
            <p className={styles.empty}>Nenhum destino encontrado.</p>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  className={`${styles.item} ${index === selected ? styles.itemActive : ''}`}
                  onMouseEnter={() => setSelected(index)}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                >
                  <Icon size={16} className={styles.itemIcon} />
                  <span className={styles.itemLabel}>{item.label}</span>
                  {index === selected && <CornerDownLeft size={14} className={styles.enterIcon} />}
                </button>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <span><kbd className={styles.kbd}>↑</kbd> <kbd className={styles.kbd}>↓</kbd> navegar</span>
          <span><kbd className={styles.kbd}>Enter</kbd> abrir</span>
        </div>
      </div>
    </div>
  );
}