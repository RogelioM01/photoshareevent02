import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuthUser } from '@/lib/auth';
import { useAuthLoading } from '@/contexts/loading-context';
import type { AuthUser } from '@/lib/auth';
import type { EventUser } from '@shared/schema';

/**
 * CRITICAL ARCHITECTURE - AuthContext for Centralized Authentication
 * 
 * PURPOSE: Eliminates race conditions in authentication state management
 * 
 * PROBLEM SOLVED:
 * - Race condition between effectiveUserId (useMemo) and currentUser (useEffect) in Gallery
 * - Multiple localStorage reads causing inconsistent state across components
 * - Authentication state scattered without central source of truth
 * 
 * DEBUGGING GUIDE:
 * - authUser: From login system (priority 1) - check localStorage 'authUser' key
 * - currentUser: For guest users who joined event (priority 2) - check localStorage 'currentUser' key  
 * - effectiveUserId: Computed as authUser?.id || currentUser?.id
 * - Cross-tab sync: Storage event listener updates state automatically
 * 
 * COMMON BUGS TO CHECK:
 * - If authentication fails: Clear localStorage keys and refresh
 * - If user loses session: Check refreshAuth() execution in useEffect
 * - If race conditions occur: Ensure hooks use AuthContext, not direct localStorage
 */
interface AuthContextType {
  authUser: AuthUser | null;        // PRIMARY: From login authentication system
  currentUser: EventUser | null;    // SECONDARY: For event participation (guest users)
  effectiveUserId: string | undefined; // COMPUTED: The actual user ID for operations
  isLoading: boolean;               // Loading state for auth initialization
  setCurrentUser: (user: EventUser | null) => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [currentUser, setCurrentUser] = useState<EventUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startAuthLoading, stopAuthLoading } = useAuthLoading();

  // Calculate effective user ID based on priority
  const effectiveUserId = authUser?.id || currentUser?.id;

  const refreshAuth = () => {
    setIsLoading(true);
    startAuthLoading();
    
    try {
      // Priority 1: Check for authUser (from login system)
      const auth = getAuthUser();
      setAuthUser(auth);
      
      if (auth) {
        // If we have authUser, don't need currentUser from localStorage
        setCurrentUser(null);
        setIsLoading(false);
        stopAuthLoading();
        return auth;
      }
      
      // Priority 2: Check for currentUser (guest users who joined event)
      const currentUserStored = localStorage.getItem("currentUser");
      
      if (currentUserStored) {
        try {
          const parsed = JSON.parse(currentUserStored);
          
          // Ensure the parsed user has all required fields
          if (parsed && parsed.id && parsed.name && parsed.eventId) {
            // Add createdAt if missing for backward compatibility
            if (!parsed.createdAt) {
              parsed.createdAt = new Date();
            }
            setCurrentUser(parsed);
            setIsLoading(false);
            stopAuthLoading();
            return parsed;
          } else {
            setCurrentUser(null);
            localStorage.removeItem("currentUser");
          }
        } catch (error) {
          setCurrentUser(null);
          localStorage.removeItem("currentUser");
        }
      } else {
        // Explicitly set to null if no currentUser in localStorage
        setCurrentUser(null);
      }
      
      // If no valid stored data, clear everything and finish loading
      setIsLoading(false);
      stopAuthLoading();
      return null;
    } catch (error) {
      console.error('Auth refresh error:', error);
      setCurrentUser(null);
      setAuthUser(null);
      setIsLoading(false);
      stopAuthLoading();
      return null;
    }
  };

  // Initialize authentication state
  useEffect(() => {
    refreshAuth();
  }, []);

  // Listen for localStorage changes (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authUser' || e.key === 'currentUser') {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: AuthContextType = {
    authUser,
    currentUser,
    effectiveUserId,
    isLoading,
    setCurrentUser,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}