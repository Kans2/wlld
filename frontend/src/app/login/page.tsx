'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Auth context will update, then redirect from home page
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_card}>
        <div className={styles.auth_header}>
          <div className={styles.auth_logo}>🎭</div>
          <h1 className={styles.auth_title}>Welcome Back</h1>
          <p className={styles.auth_subtitle}>Sign in to your Meme&apos;d account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.form_group}>
            <label className={styles.form_label}>Email</label>
            <input
              type="email"
              className={styles.form_input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.form_group}>
            <label className={styles.form_label}>Password</label>
            <input
              type="password"
              className={styles.form_input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className={styles.submit_btn}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.auth_footer}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className={styles.auth_link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
