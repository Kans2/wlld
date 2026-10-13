'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href={user.role === 'brand' ? '/brand' : '/creator'} className={styles.logo}>
          <span className={styles.logoIcon}>🎭</span>
          <span className={styles.logoText}>Meme'd</span>
        </Link>

        <div className={styles.nav_links}>
          {user.role === 'brand' ? (
            <>
              <Link href="/brand" className={styles.link}>Dashboard</Link>
              <Link href="/brand/campaigns/new" className={styles.link}>New Campaign</Link>
            </>
          ) : (
            <>
              <Link href="/creator" className={styles.link}>Dashboard</Link>
              <Link href="/creator/campaigns" className={styles.link}>Browse Campaigns</Link>
            </>
          )}
        </div>

        <div className={styles.user_section}>
          <div className={styles.user_info}>
            <span className={styles.user_name}>{user.name}</span>
            <span className={styles.user_role}>{user.role}</span>
          </div>
          <button onClick={handleLogout} className={styles.logout_btn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
