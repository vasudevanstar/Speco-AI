'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
  createdAt?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;
      setUser(userData);
      setFormData({
        name: userData?.name || 'Demo User',
        email: userData?.email || 'demo@speco.ai',
      });
    } catch (error: any) {
      console.error('Failed to load user:', error);
      const defaultUser = { id: 'demo-user', name: 'Demo User', email: 'demo@speco.ai', role: 'admin' };
      setUser(defaultUser as any);
      setFormData({
        name: defaultUser.name,
        email: defaultUser.email,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.patch('/auth/me', {
        name: formData.name,
      });
      const updatedUser = response.data.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileNav />
        <main className="md:ml-64 min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[2rem] p-8 text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">wifi_off</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Server Not Running</h2>
          <p className="text-on-surface-variant mb-8">The backend server is not running. Please start the server to continue.</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-primary text-white rounded-xl h-12">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[2rem] p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">key_off</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Session Expired</h2>
          <p className="text-on-surface-variant mb-8">Your session has expired. Please sign in again to continue.</p>
          <Button onClick={() => router.push('/')} className="w-full bg-primary text-white rounded-xl h-12">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />
      
      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Account Settings" />
        
        <div className="w-full pt-24 px-6 pb-12 sm:px-10 max-w-4xl mx-auto animate-fade-in">
          
          <div className="mb-10 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary-container/30 to-primary-fixed/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-8 shadow-xl shadow-primary">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center text-4xl font-bold shadow-lg shadow-primary shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold mb-2">{user?.name || 'User'}</h1>
                <p className="text-on-surface-variant mb-4">{user?.email || 'user@example.com'}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs font-bold rounded-full border border-outline-variant capitalize">
                    {user?.role || 'Member'}
                  </span>
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs font-bold rounded-full border border-outline-variant">
                    Joined {formatDate(user?.createdAt || (user as any)?.created_at)}
                  </span>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" className="hidden sm:flex border-outline-variant hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                <span className="material-symbols-outlined mr-2 text-sm">logout</span>
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Settings */}
            <div className="lg:col-span-2 space-y-8">
              
              <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">edit_square</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Personal Details</h2>
                    <p className="text-sm text-on-surface-variant">Update your profile information</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold text-on-surface-variant">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="h-14 rounded-xl bg-surface-container-low border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-base px-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold text-on-surface-variant">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="h-14 rounded-xl bg-surface-container border-transparent text-base px-4 text-on-surface-variant/70 cursor-not-allowed"
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">lock</span>
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-1">Contact support to change your email address.</p>
                  </div>

                  <div className="pt-4 border-t border-surface-container">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving || formData.name === user?.name} 
                      className="bg-primary text-white h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </div>
              </section>

            </div>

            {/* Right Column: Info & Danger */}
            <div className="space-y-8">

              <section className="bg-surface-container-lowest rounded-2xl p-6 border border-primary/20 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.15em] text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">credit_card</span>
                    Subscription
                  </h3>
                  <Button
                    onClick={() => router.push('/subscription')}
                    variant="ghost"
                    className="h-8 text-xs font-bold text-primary hover:bg-primary/10 px-2.5 rounded-lg"
                  >
                    Manage
                  </Button>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-on-background">PayPal Subscription</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary text-white">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    PayPal Developer Sandbox integrated. Monitor monthly quotas and transaction receipts.
                  </p>
                  <Button
                    onClick={() => router.push('/subscription')}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs shadow-md shadow-primary/20"
                  >
                    Open Billing Dashboard
                  </Button>
                </div>
              </section>

              <section className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-4">Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">shield_locked</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Password</p>
                      <p className="text-xs text-on-surface-variant">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">history</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Last Login</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(user?.lastLogin || (user as any)?.last_login)}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="glass-card rounded-3xl p-8 border border-red-500/20 shadow-[0_10px_40px_rgba(239,68,68,0.1)] relative overflow-hidden group hover:border-red-500/40 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-red-500/20 transition-colors duration-500 pointer-events-none"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 mb-4 flex items-center gap-2 relative z-10 drop-shadow-sm">
                  <span className="material-symbols-outlined text-sm material-symbols-filled animate-pulse">warning</span> Danger Zone
                </h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-8 relative z-10 group-hover:text-red-400/80 transition-colors">
                  Once you delete your account, there is no going back. All your projects, modules, and FRDs will be permanently wiped. Please be certain.
                </p>
                <div className="relative z-10">
                  <Button 
                    variant="outline" 
                    className="w-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-bold h-14 rounded-xl shadow-sm hover:shadow-[0_10px_20px_rgba(239,68,68,0.3)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                  >
                    Delete Account
                  </Button>
                  <Button 
                    onClick={handleLogout} 
                    variant="ghost" 
                    className="w-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 mt-4 sm:hidden h-14 rounded-xl font-bold transition-all duration-300"
                  >
                    Sign Out
                  </Button>
                </div>
              </section>
              
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
