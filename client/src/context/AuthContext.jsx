import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEFAULT_STUDENT = {
  id: 'usr_68201',
  fullName: 'Alex Mercer',
  email: 'alex.mercer@ves.ac.in',
  classBranch: 'D12C / EXTC',
  rollNo: '2021EXTC042',
  role: 'student',
  isVerifiedStudent: true,
  phone: '+91 98765 43210',
  bio: 'Engineering student interested in electronics and vintage books. Always looking for a good deal on reference materials.',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  memberSince: 'June 2023',
  stats: {
    itemsSold: 12,
    itemsBought: 8,
    rating: 4.9
  },
  notificationPreferences: {
    outbidAlerts: true,
    auctionEndingAlerts: true,
    newMessageAlerts: false
  }
};

const DEFAULT_ADMIN = {
  id: 'usr_admin_01',
  fullName: 'Prof. S. R. Sharma (Admin)',
  email: 'admin.moderation@ves.ac.in',
  classBranch: 'Faculty / Admin Cell',
  rollNo: 'FAC-2024',
  role: 'admin',
  isVerifiedStudent: true,
  phone: '+91 98200 11223',
  bio: 'VESIT Campus Marketplace Administrator & Moderation In-charge.',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  memberSince: 'January 2023',
  stats: {
    itemsSold: 0,
    itemsBought: 0,
    rating: 5.0
  },
  notificationPreferences: {
    outbidAlerts: false,
    auctionEndingAlerts: true,
    newMessageAlerts: true
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campusbid_user');
    return saved ? JSON.parse(saved) : DEFAULT_STUDENT;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('campusbid_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('campusbid_user');
    }
  }, [user]);

  const login = (email, role = 'student') => {
    if (role === 'admin' || email.includes('admin')) {
      setUser({ ...DEFAULT_ADMIN, email });
    } else {
      setUser({ ...DEFAULT_STUDENT, email });
    }
  };

  const register = (data) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      classBranch: data.classBranch || 'D15A / CMPN',
      rollNo: data.rollNo || '28',
      role: 'student',
      isVerifiedStudent: true,
      phone: '+91 98765 43210',
      bio: 'VESIT Student',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
      memberSince: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      stats: { itemsSold: 0, itemsBought: 0, rating: 5.0 },
      notificationPreferences: {
        outbidAlerts: true,
        auctionEndingAlerts: true,
        newMessageAlerts: true
      }
    };
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updatedFields) => {
    setUser((prev) => ({
      ...prev,
      ...updatedFields
    }));
  };

  const toggleRole = () => {
    if (user?.role === 'admin') {
      setUser(DEFAULT_STUDENT);
    } else {
      setUser(DEFAULT_ADMIN);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
        toggleRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
