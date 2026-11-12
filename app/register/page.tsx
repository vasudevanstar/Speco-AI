'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      const payload = response.data?.data ?? response.data;
      const token = payload?.token;
      const user = payload?.user;
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/');
    } catch (err: any) {
      if (err.message?.includes('Network') || err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary mb-6">
            <span className="material-symbols-outlined material-symbols-filled text-3xl">deployed_code</span>
          </div>
          <h1 className="text-3xl font-bold text-on-background tracking-tight">Create your account</h1>
          <p className="text-on-surface-variant mt-2 text-center">
            Join Speco and start building smarter specifications
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-10 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold ml-1">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="h-12 px-4 rounded-xl border-outline-variant focus:border-primary focus:ring-primary transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold ml-1">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="h-12 px-4 rounded-xl border-outline-variant focus:border-primary focus:ring-primary transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold ml-1">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-12 px-4 rounded-xl border-outline-variant focus:border-primary focus:ring-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold ml-1">Confirm</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-12 px-4 rounded-xl border-outline-variant focus:border-primary focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70" 
              disabled={loading}
            >
              {loading ? (
                <Loader term="Signing up..." />
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-surface-container flex flex-col items-center gap-4">
            <p className="text-sm text-on-surface-variant">
              Already have an account?{' '}
              <button 
                type="button"
                className="font-bold text-primary hover:underline" 
                onClick={() => router.push('/')}
              >
                Go to Dashboard
              </button>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-on-surface-variant/50">
          By signing up, you agree to our Terms and Data Policy.
        </p>
      </div>
    </div>
  );
}

function Loader({ term }: { term: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span>{term}</span>
    </div>
  );
}
