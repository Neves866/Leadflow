"use client";

import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';
import { getSafeNextPath } from '@/lib/auth/redirect';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      const next = searchParams.get('next');
      const safeNext = getSafeNextPath(next);

      router.push(safeNext);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.experiencePanel} aria-hidden="true">
        <div className={styles.gridTexture} />
        <div className={styles.glowOne} />
        <div className={styles.glowTwo} />

        <div className={styles.brandRow}>
          <div className={styles.brandMark}>LF</div>
          <div>
            <div className={styles.brandName}>LeadFlow</div>
            <div className={styles.brandCaption}>COMMAND CENTER</div>
          </div>
        </div>

        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>CRM INTELIGENTE</span>
          <h1 className={styles.headline}>
            Transforme oportunidades
            <span> em movimento.</span>
          </h1>
          <p className={styles.description}>
            Organize seu pipeline, acompanhe cada oportunidade e mantenha sua operação comercial em movimento.
          </p>
        </div>

        <div className={styles.flowStage}>
          <div className={`${styles.flowCard} ${styles.flowLead}`}>
            <div className={styles.flowCardTop}>
              <span className={styles.liveDot} />
              Lead recebido
            </div>
            <strong>Anthony R.</strong>
            <small>Site • agora</small>
          </div>

          <div className={`${styles.flowCard} ${styles.flowQualified}`}>
            <span className={styles.flowKicker}>ETAPA</span>
            <strong>Qualificado</strong>
            <div className={styles.miniMeter}><span /></div>
          </div>

          <div className={`${styles.flowCard} ${styles.flowValue}`}>
            <span className={styles.flowKicker}>POTENCIAL</span>
            <strong>R$ 2.450</strong>
            <small>oportunidade ativa</small>
          </div>

          <div className={`${styles.flowCard} ${styles.flowNegotiation}`}>
            <span className={styles.flowKicker}>PIPELINE</span>
            <strong>Negociação</strong>
            <small>próxima ação hoje</small>
          </div>

          <div className={`${styles.flowCard} ${styles.flowClosed}`}>
            <span className={styles.successIcon}><Check size={13} strokeWidth={3} /></span>
            <div>
              <span className={styles.flowKicker}>RESULTADO</span>
              <strong>Fechado</strong>
            </div>
          </div>

          <span className={`${styles.connector} ${styles.connectorOne}`}><i /></span>
          <span className={`${styles.connector} ${styles.connectorTwo}`}><i /></span>
          <span className={`${styles.connector} ${styles.connectorThree}`}><i /></span>
          <span className={`${styles.connector} ${styles.connectorFour}`}><i /></span>
          <span className={`${styles.node} ${styles.nodeOne}`} />
          <span className={`${styles.node} ${styles.nodeTwo}`} />
          <span className={`${styles.node} ${styles.nodeThree}`} />
        </div>

        <div className={styles.featureLine}>Pipeline <span>•</span> Contatos <span>•</span> Automação <span>•</span> Inteligência</div>
      </section>

      <section className={styles.loginPanel}>
        <div className={styles.mobileBrand}>
          <div className={styles.brandMark}>LF</div>
          <div>
            <div className={styles.brandNameMobile}>LeadFlow</div>
            <div className={styles.brandCaptionMobile}>COMMAND CENTER</div>
          </div>
        </div>

        <div className={styles.loginContent}>
          <header className={styles.loginHeader}>
            <span className={styles.loginEyebrow}>ACESSO AO WORKSPACE</span>
            <h2>Bem-vindo de volta</h2>
            <p>Entre para acessar seu workspace comercial.</p>
          </header>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <div className={styles.inputShell}>
                <Mail size={18} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Senha</label>
              <div className={styles.inputShell}>
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorMessage} role="alert">
                <CircleAlert size={17} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              <span>{loading ? 'Entrando...' : 'Entrar no LeadFlow'}</span>
              {!loading && <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </form>

          <div className={styles.securityNote}>
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Ambiente seguro</span>
          </div>
        </div>
      </section>
    </main>
  );
}
