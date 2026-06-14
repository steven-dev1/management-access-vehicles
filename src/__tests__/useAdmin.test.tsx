import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AdminProvider, useAdminLogout } from '../hooks/useAdmin';

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

import { supabase } from '../lib/supabase';

describe('useAdminLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls signOut with local scope first', async () => {
    const onLogout = jest.fn();
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminProvider onLogout={onLogout}>{children}</AdminProvider>
    );

    const { result } = renderHook(() => useAdminLogout(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(2);
    expect(onLogout).toHaveBeenCalled();
  });

  it('calls onLogout even if signOut fails', async () => {
    const onLogout = jest.fn();
    (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error('Network error'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminProvider onLogout={onLogout}>{children}</AdminProvider>
    );

    const { result } = renderHook(() => useAdminLogout(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(onLogout).toHaveBeenCalled();
  });
});
