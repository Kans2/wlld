'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'brand' | 'creator'>('creator');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, role);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_card}>
        <div className={styles.auth_header}>
          <div className={styles.auth_logo}>🎭</div>
          <h1 className={styles.auth_title}>Join Meme&apos;d</h1>
          <p className={styles.auth_subtitle}>Create your account to get started</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.form_group}>
            <label className={styles.form_label}>Name</label>
            <input
              type="text"
              className={styles.form_input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              minLength={2}
            />
          </div>

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

          <div className={styles.form_group}>
            <label className={styles.form_label}>I am a</label>
            <div className={styles.role_selector}>
              <label className={styles.role_option}>
                <input
                  type="radio"
                  name="role"
                  value="creator"
                  checked={role === 'creator'}
                  onChange={() => setRole('creator')}
                />
                <div className={styles.role_label}>
                  <span className={styles.role_icon}>🎨</span>
                  <span className={styles.role_name}>Creator</span>
                  <span className={styles.role_desc}>Post content & earn</span>
                </div>
              </label>
              <label className={styles.role_option}>
                <input
                  type="radio"
                  name="role"
                  value="brand"
                  checked={role === 'brand'}
                  onChange={() => setRole('brand')}
                />
                <div className={styles.role_label}>
                  <span className={styles.role_icon}>🏢</span>
                  <span className={styles.role_name}>Brand</span>
                  <span className={styles.role_desc}>Run campaigns</span>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submit_btn}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.auth_footer}>
          Already have an account?{' '}
          <Link href="/login" className={styles.auth_link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
