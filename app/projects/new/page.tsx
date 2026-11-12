'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import ContentBreadcrumbs from '@/components/layout/ContentBreadcrumbs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronDown, X, ArrowRight, Loader2 } from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  industry: string;
  projectTypes: string[];
  scale: string;
  userVolume: string;
  userVolumeType: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    industry: 'Technology & SaaS',
    projectTypes: ['Web Application'],
    scale: 'enterprise',
    userVolume: '5000',
    userVolumeType: 'monthly',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleProjectType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      projectTypes: [type], // Restrict to exactly one project type
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/projects', {
        title: formData.title,
        description: formData.description,
        industry: formData.industry,
        projectTypes: formData.projectTypes,
        scale: formData.scale,
        userVolume: formData.userVolume ? parseInt(formData.userVolume) : null,
        userVolumeType: formData.userVolumeType,
      });
      router.push(`/projects/${response.data.data.id}`);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      if (err.message?.includes('Network') || err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.error || 'Failed to create project.');
      }
    } finally {
      setLoading(false);
    }
  };

  const projectTypes = [
    'Web Application',
    'Mobile Application',
    'Desktop Application',
    'SaaS Product',
    'Internal Business System',
    'E-Commerce',
    'ERP / CRM',
    'Other'
  ];
  const industries = ['Technology & SaaS', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Other'];
  
  const scales = [
    { value: 'small', label: 'Small', width: '25%', color: 'bg-emerald-500' },
    { value: 'medium', label: 'Medium', width: '50%', color: 'bg-blue-400' },
    { value: 'large', label: 'Large', width: '75%', color: 'bg-blue-600' },
    { value: 'enterprise', label: 'Enterprise', width: '100%', color: 'bg-primary' },
  ];

  const volumeTypes = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'total', label: 'Total' },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-fixed selection:text-primary">
      <Sidebar />
      <MobileNav />
      
      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="New Project" />
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 mt-16 animate-fade-in text-on-surface">
          <div className="max-w-4xl w-full relative">
            <ContentBreadcrumbs 
              items={[
                { label: 'Projects', href: '/projects' },
                { label: 'New' }
              ]} 
              className="mb-8"
            />
            <Card className="rounded-2xl border-none shadow-2xl shadow-black/5 p-8 sm:p-12 relative overflow-hidden bg-surface-container-lowest">
            <button 
              onClick={() => router.back()}
              className="absolute top-10 right-10 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight text-on-background mb-2">Create New Project</h1>
              <p className="text-on-surface-variant">Define your vision and set up your workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2 animate-shake">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">
                  Project Name
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Phoenix Global Expansion"
                  className="h-16 px-6 rounded-xl border-outline-variant focus:border-primary focus:ring-primary transition-all text-lg font-medium"
                  required
                />
              </div>

              <div className="space-y-4 relative">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">
                    Description
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10 px-2"
                    onClick={async () => {
                      if (!formData.description) return;
                      const prevDesc = formData.description;
                      try {
                        const btn = document.getElementById('refine-desc-btn');
                        if (btn) btn.innerHTML = '<span class="animate-spin mr-1">⌛</span> Refining...';
                        const res = await api.post('/ai/refine', { text: formData.description });
                        if (res.data?.refinedText) {
                          setFormData(prev => ({ ...prev, description: res.data.refinedText }));
                        }
                      } catch (e) {
                        console.error('Failed to refine:', e);
                      } finally {
                        const btn = document.getElementById('refine-desc-btn');
                        if (btn) btn.innerHTML = '✨ Refine text';
                      }
                    }}
                    id="refine-desc-btn"
                  >
                    ✨ Refine text
                  </Button>
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Briefly describe the project scope and primary objectives... (You can type in Tanglish or rough notes, then click 'Refine text')"
                  className="w-full min-h-[120px] p-6 rounded-xl border border-outline-variant focus:border-primary focus:ring-primary outline-none transition-all text-sm font-medium leading-relaxed bg-surface-container-lowest"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">
                    Project Type
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {projectTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleProjectType(type)}
                        className={cn(
                          "px-6 py-2.5 rounded-full text-sm font-bold transition-all border-none",
                          formData.projectTypes.includes(type)
                            ? "bg-primary text-white shadow-lg shadow-primary"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="industry" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">
                    Industry
                  </Label>
                  <Select 
                    value={formData.industry} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-8 flex flex-col md:flex-row gap-12 border border-surface-container/50">
                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant italic opacity-70">
                      Expected Complexity
                    </Label>
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded-full">
                      {scales.find(s => s.value === formData.scale)?.label}
                    </span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="relative h-2 bg-surface-container-highest/30 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]",
                          scales.find(s => s.value === formData.scale)?.color || "bg-primary"
                        )}
                        style={{ width: scales.find(s => s.value === formData.scale)?.width || '0%' }}
                      />
                    </div>
                    
                    <div className="flex justify-between gap-2">
                      {scales.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, scale: s.value }))}
                          className={cn(
                            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border",
                            formData.scale === s.value
                              ? "bg-surface-container-lowest border-primary/20 text-primary shadow-sm scale-[1.02]"
                              : "bg-transparent border-transparent text-on-surface-variant/40 hover:text-on-surface-variant"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 min-w-[240px]">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant italic opacity-70">
                      Expected Users
                    </Label>
                    <div className="flex bg-surface-container-highest/20 p-1 rounded-lg">
                      {volumeTypes.map((vt) => (
                        <button
                          key={vt.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, userVolumeType: vt.value }))}
                          className={cn(
                            "px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all",
                            formData.userVolumeType === vt.value
                              ? "bg-surface-container-lowest text-primary shadow-sm"
                              : "text-on-surface-variant/40 hover:text-on-surface-variant"
                          )}
                        >
                          {vt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-surface-container-lowest px-5 h-14 rounded-xl border border-outline-variant shadow-sm transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary">
                    <span className="material-symbols-outlined text-primary text-xl opacity-60">groups</span>
                    <input
                      type="number"
                      name="userVolume"
                      value={formData.userVolume}
                      onChange={handleChange}
                      className="w-full h-full outline-none text-base font-black text-on-background bg-transparent"
                      placeholder="5000"
                    />
                    <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter whitespace-nowrap">
                      {formData.userVolumeType === 'monthly' ? '/ month' : 'total'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-8 pt-6">
                <button 
                  type="button" 
                  onClick={() => router.back()}
                  className="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-14 px-10 bg-primary text-white rounded-xl font-black text-lg shadow-2xl shadow-primary hover:translate-y-[-4px] active:scale-95 transition-all flex items-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Create Project
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </Button>
              </div>
            </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
