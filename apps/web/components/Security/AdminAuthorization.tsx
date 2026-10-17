'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLHSession } from '@components/Contexts/LHSessionContext';
import useAdminStatus from '@components/Hooks/useAdminStatus';
import { usePathname, useRouter } from 'next/navigation';
import PageLoading from '@components/Objects/Loaders/PageLoading';
import { getUriWithOrg } from '@services/config/config';
import { useOrg } from '@components/Contexts/OrgContext';

type AuthorizationProps = {
  children: React.ReactNode;
  authorizationMode: 'component' | 'page';
};

/**
 * The whole dashboard is admin-only — instructors never enter it.
 * One rule for the entire `/dash` tree instead of a hand-maintained path list
 * (which kept leaving newer pages such as the home, communities and podcasts
 * outside the gate).
 */
const DASH_PREFIX = '/dash';

const AdminAuthorization: React.FC<AuthorizationProps> = ({ children, authorizationMode }) => {
  const session = useLHSession() as any;
  const org = useOrg() as any;
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, loading } = useAdminStatus() as any
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isUserAuthenticated = useMemo(() => session.status === 'authenticated', [session.status]);

  // The middleware rewrites `/dash/*` to `/orgs/{slug}/dash/*`, but
  // `usePathname()` can still report either form (SSR vs client navigation),
  // so normalise before matching.
  const isAdminPath = useMemo(() => {
    if (typeof pathname !== 'string') return false;
    const normalized = pathname.replace(/^\/orgs\/[^/]+/, '');
    return normalized === DASH_PREFIX || normalized.startsWith(`${DASH_PREFIX}/`);
  }, [pathname]);

  const authorizeUser = useCallback(() => {
    if (loading) {
      return; // Wait until the admin status is determined
    }

    if (!isUserAuthenticated) {
      router.push(getUriWithOrg(org.slug, '/login'));
      return;
    }

    if (authorizationMode === 'page') {
      if (isAdminPath) {
        if (isAdmin) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          // Never send them back to `/dash` — that page is gated too.
          router.push(getUriWithOrg(org.slug, '/'));
        }
      } else {
        setIsAuthorized(true);
      }
    } else if (authorizationMode === 'component') {
      setIsAuthorized(isAdmin);
    }
  }, [loading, isUserAuthenticated, isAdmin, isAdminPath, authorizationMode, router, org.slug]);

  useEffect(() => {
    authorizeUser();
  }, [authorizeUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <PageLoading />
      </div>
    );
  }

  if (authorizationMode === 'page' && !isAuthorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl">You are not authorized to access this page</h1>
      </div>
    );
  }

  return <>{isAuthorized && children}</>;
};

export default AdminAuthorization;
