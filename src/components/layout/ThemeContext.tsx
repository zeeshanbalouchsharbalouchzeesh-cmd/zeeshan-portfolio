import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, User, UserRole, ThemeName } from '../../types/index.ts';
import { api, setActiveTenantId } from '../../services/api.ts';

interface AppContextType {
  tenant: Tenant | null;
  user: User | null;
  role: UserRole;
  isDarkMode: boolean;
  theme: ThemeName;
  allTenants: Tenant[];
  isLoading: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleDarkMode: () => void;
  switchTenant: (id: number) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshTenant: () => Promise<void>;
  reloadAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('owner');
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to dark mode for Midnight Teal aesthetic
  const [theme, setThemeState] = useState<ThemeName>('midnight-teal');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadAll = async () => {
    try {
      setIsLoading(true);
      const data = await api.bootstrap();
      if (data.activeTenant) {
        setTenant(data.activeTenant);
        setActiveTenantId(data.activeTenant.id);
        if (data.activeTenant.theme) {
          setThemeState(data.activeTenant.theme);
        }
      }
      if (data.activeUser) {
        setUser(data.activeUser);
        setRole(data.activeUser.role);
      }
      if (data.allTenants) {
        setAllTenants(data.allTenants);
      }
    } catch (err) {
      console.error('Failed to bootstrap app context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadAll();
  }, []);

  const switchTenant = async (id: number) => {
    try {
      setIsLoading(true);
      setActiveTenantId(id);
      const res = await api.switchTenant(id);
      if (res.tenant) {
        setTenant(res.tenant);
        if (res.tenant.theme) setThemeState(res.tenant.theme);
      }
      await reloadAll();
    } catch (err) {
      console.error('Failed to switch tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    try {
      const res = await api.switchRole(newRole);
      if (res.user) {
        setUser(res.user);
        setRole(newRole);
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const refreshTenant = async () => {
    try {
      const updated = await api.getCurrentTenant();
      if (updated) {
        setTenant(updated);
        if (updated.theme) setThemeState(updated.theme);
      }
    } catch (err) {
      console.error('Failed to refresh tenant:', err);
    }
  };

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    if (tenant) {
      try {
        await api.updateTenant(tenant.id, { theme: newTheme });
        setTenant({ ...tenant, theme: newTheme });
      } catch (err) {
        console.error('Failed to persist theme:', err);
      }
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        tenant,
        user,
        role,
        isDarkMode,
        theme,
        allTenants,
        isLoading,
        setTheme,
        toggleDarkMode,
        switchTenant,
        switchRole,
        refreshTenant,
        reloadAll,
      }}
    >
      <div
        className={`${isDarkMode ? 'dark' : ''} ${
          theme === 'midnight-teal'
            ? 'theme-midnight-teal'
            : theme === 'royal-purple'
            ? 'theme-royal-purple'
            : theme === 'emerald-green'
            ? 'theme-emerald-green'
            : theme === 'midnight-black'
            ? 'theme-midnight-black'
            : 'theme-pure-white'
        }`}
      >
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
