import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AdminContextType {
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({ logout: async () => {} });

export function AdminProvider({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const logout = useCallback(async () => {
    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    try { await supabase.auth.signOut(); } catch {}
    onLogout();
  }, [onLogout]);

  return (
    <AdminContext.Provider value={{ logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminLogout() {
  return useContext(AdminContext);
}
