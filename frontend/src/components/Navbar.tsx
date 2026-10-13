'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, LayoutDashboard, PlusCircle, Compass, LogOut, User } from 'lucide-react';
import styles from './Navbar.module.css';

function NavbarContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const isBrand = user.role === 'brand';

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.left_section}>
          <Link href={isBrand ? '/brand' : '/creator'} className={styles.logo}>
            <div className={styles.logoBadge}>
              <Sparkles size={18} className={styles.logoIcon} />
            </div>
            <span className={styles.logoText}>Meme&apos;d</span>
          </Link>

          <div className={styles.nav_links}>
            {isBrand ? (
              <>
                <Link
                  href="/brand"
                  className={`${styles.link} ${pathname === '/brand' ? styles.activeLink : ''}`}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/brand/campaigns/new"
                  className={`${styles.link} ${pathname === '/brand/campaigns/new' ? styles.activeLink : ''}`}
                >
                  <PlusCircle size={16} />
                  <span>New Campaign</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/creator"
                  className={`${styles.link} ${pathname === '/creator' ? styles.activeLink : ''}`}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/creator/campaigns"
                  className={`${styles.link} ${pathname === '/creator/campaigns' ? styles.activeLink : ''}`}
                >
                  <Compass size={16} />
                  <span>Browse Campaigns</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className={styles.user_section}>
          <div className={styles.user_info}>
            <div className={styles.avatar}>
              <User size={15} />
            </div>
            <div className={styles.user_meta}>
              <span className={styles.user_name}>{user.name}</span>
              <span className={styles.user_role}>{user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logout_btn} title="Sign out">
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
