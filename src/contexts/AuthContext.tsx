import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User } from '../types';
import { getAuthErrorMessage } from '../utils/authErrors';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserDocument = async (firebaseUser: FirebaseUser, additionalData?: any) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const userData: Omit<User, 'uid'> = {
          displayName: firebaseUser.displayName || additionalData?.displayName || '',
          email: firebaseUser.email,
          role: 'user',
          createdAt: new Date(),
          ...additionalData
        };

        await setDoc(userRef, userData);
      }

      const updatedSnap = await getDoc(userRef);
      return { uid: firebaseUser.uid, ...updatedSnap.data() } as User;
    } catch (error) {
      console.warn('Firestore access failed, using fallback user data:', error);
      // Fallback: create user object from Firebase Auth data only
      return {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || additionalData?.displayName || '',
        email: firebaseUser.email,
        role: 'user' as const,
        createdAt: new Date(),
        ...additionalData
      } as User;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with email:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login error:', error);
      const friendlyMessage = getAuthErrorMessage(error.code);
      throw new Error(friendlyMessage);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      console.log('Attempting registration with email:', email);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registration successful, creating user document');
      await createUserDocument(user, { displayName });
      console.log('User document created');
    } catch (error: any) {
      console.error('Registration error:', error);
      const friendlyMessage = getAuthErrorMessage(error.code);
      throw new Error(friendlyMessage);
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log('Attempting Google login');
      await signInWithPopup(auth, googleProvider);
      console.log('Google login successful');
    } catch (error: any) {
      console.error('Google login error:', error);
      const friendlyMessage = getAuthErrorMessage(error.code);
      throw new Error(friendlyMessage);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
        if (firebaseUser) {
          console.log('Firebase user:', firebaseUser.email);
          const user = await createUserDocument(firebaseUser);
          console.log('User document created/retrieved:', user);
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error in auth state change:', error);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    register,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
