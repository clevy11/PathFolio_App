'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  links: Record<string, string>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    technologies: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    link: string;
    technologies: string[];
  }>;
}

const initialProfile: ProfileData = {
  name: '',
  email: '',
  phone: '',
  summary: '',
  skills: [],
  links: { linkedin: '', github: '', portfolio: '' },
  education: [],
  experience: [],
  projects: [],
};

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience' | 'education' | 'projects' | 'links'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvParsed, setCvParsed] = useState<Record<string, string | string[] | null> | null>(null);
  const [showCvPreview, setShowCvPreview] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCvUpload = async (file: File) => {
    setCvUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.suggestedProfile) {
        setCvParsed(data.suggestedProfile);
        setShowCvPreview(true);
      }
    } catch (error) {
      console.error('CV upload failed:', error);
    } finally {
      setCvUploading(false);
    }
  };

  const applyCvData = () => {
    if (cvParsed) {
      setProfile(prev => ({ ...prev, ...cvParsed }));
      setShowCvPreview(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'user' },
    { id: 'skills', label: 'Skills', icon: 'code' },
    { id: 'experience', label: 'Experience', icon: 'briefcase' },
    { id: 'education', label: 'Education', icon: 'graduation-cap' },
    { id: 'projects', label: 'Projects', icon: 'folder-open' },
    { id: 'links', label: 'Links', icon: 'link' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">CV Vault</h1>
          <p className="text-sm text-slate-500">Manage your master profile & documents</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-auto">
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      {showCvPreview && cvParsed && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-emerald-400">CV Parsed Successfully</CardTitle>
                <CardDescription>Review extracted data and apply to profile</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCvPreview(false)}>Dismiss</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(cvParsed).map(([key, value]) => (
                <div key={key} className="bg-white/5 p-2 rounded">
                  <p className="text-slate-400 text-xs">{key}</p>
                  <p className="font-mono truncate">{Array.isArray(value) ? value.join(', ') : value}</p>
                </div>
              ))}
            </div>
            <Button onClick={applyCvData} className="w-full">Apply to Profile</Button>
          </CardContent>
        </Card>
      )}

      <Card className="glass-panel">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                  <input
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    type="email"
                    className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone</label>
                  <input
                    value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Professional Summary</label>
                <textarea
                  value={profile.summary}
                  onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))}
                  rows={4}
                  className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs text-slate-400">Skills (comma separated)</label>
                <Button variant="outline" size="sm" onClick={() => setProfile(p => ({ ...p, skills: [...p.skills, ''] }))}>
                  Add Skill
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                    <input
                      value={skill}
                      onChange={e => setProfile(p => ({ ...p, skills: p.skills.map((s, i) => i === idx ? e.target.value : s) }))}
                      className="bg-transparent border-none text-white text-sm w-40 focus:outline-none"
                    />
                    <button
                      onClick={() => setProfile(p => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }))}
                      className="text-slate-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <ExperienceSection experience={profile.experience} onChange={exp => setProfile(p => ({ ...p, experience: exp }))} />
          )}

          {activeTab === 'education' && (
            <EducationSection education={profile.education} onChange={edu => setProfile(p => ({ ...p, education: edu }))} />
          )}

          {activeTab === 'projects' && (
            <ProjectsSection projects={profile.projects} onChange={proj => setProfile(p => ({ ...p, projects: proj }))} />
          )}

          {activeTab === 'links' && (
            <div className="space-y-4">
              {Object.entries(profile.links).map(([key, value]) => (
                <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="block text-xs text-slate-400 mb-1 capitalize">{key}</label>
                  <input
                    value={value}
                    onChange={e => setProfile(p => ({ ...p, links: { ...p.links, [key]: e.target.value } }))}
                    className="md:col-span-2 bg-navy-800/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder={`https://${key}.com/username`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="file" accept=".pdf,.docx,.txt" onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleCvUpload(e.target.files[0])} className="sr-only" />
                <Button variant="outline" disabled={cvUploading}>{cvUploading ? 'Uploading...' : 'Upload CV'}</Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExperienceSection({ experience, onChange }: { experience: ProfileData['experience']; onChange: (exp: ProfileData['experience']) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  if (experience.length === 0 && editingId === null) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No experience entries yet</p>
        <Button onClick={() => setEditingId(0)}>Add Experience</Button>
      </div>
    );
  }

  const handleChange = (idx: number, field: keyof ProfileData['experience'][0], value: string) => {
    onChange(experience.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const handleTechChange = (idx: number, value: string) => {
    onChange(experience.map((e, i) => i === idx ? { ...e, technologies: value.split(',').map(s => s.trim()) } : e));
  };

  return (
    <div className="space-y-4">
      {experience.map((exp, idx) => (
        <Card key={idx} className="bg-white/5">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={exp.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'company', e.target.value)} placeholder="Company" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
              <input value={exp.role} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'role', e.target.value)} placeholder="Role" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={exp.startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'startDate', e.target.value)} placeholder="Start Date (YYYY-MM)" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
              <input value={exp.endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'endDate', e.target.value)} placeholder="End Date (YYYY-MM or Present)" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
            </div>
            <textarea value={exp.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(idx, 'description', e.target.value)} placeholder="Description" rows={3} className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white resize-none" />
            <div className="flex gap-2">
              <input value={exp.technologies?.join(', ') || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTechChange(idx, e.target.value)} placeholder="Technologies (comma separated)" className="flex-1 bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
              <Button variant="ghost" size="sm" onClick={() => onChange(experience.filter((_, i) => i !== idx))}>Remove</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {editingId === null && (
        <Button variant="outline" onClick={() => setEditingId(experience.length)}>Add Experience</Button>
      )}
    </div>
  );
}

function EducationSection({ education, onChange }: { education: ProfileData['education']; onChange: (edu: ProfileData['education']) => void }) {
  if (education.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No education entries yet</p>
        <Button onClick={() => onChange([{ institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' }])}>Add Education</Button>
      </div>
    );
  }

  const handleChange = (idx: number, field: keyof ProfileData['education'][0], value: string) => {
    onChange(education.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  return (
    <div className="space-y-4">
      {education.map((edu, idx) => (
        <Card key={idx} className="bg-white/5">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={edu.institution} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'institution', e.target.value)} placeholder="Institution" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
              <input value={edu.degree} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'degree', e.target.value)} placeholder="Degree" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
              <input value={edu.field} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'field', e.target.value)} placeholder="Field of Study" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={edu.startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'startDate', e.target.value)} placeholder="Start Date (YYYY)" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
              <input value={edu.endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'endDate', e.target.value)} placeholder="End Date (YYYY)" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
            </div>
            <textarea value={edu.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(idx, 'description', e.target.value)} placeholder="Description" rows={2} className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white resize-none" />
            <Button variant="ghost" size="sm" onClick={() => onChange(education.filter((_, i) => i !== idx))}>Remove</Button>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={() => onChange([...education, { institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' }])}>Add Education</Button>
    </div>
  );
}

function ProjectsSection({ projects, onChange }: { projects: ProfileData['projects']; onChange: (proj: ProfileData['projects']) => void }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No projects yet</p>
        <Button onClick={() => onChange([{ name: '', description: '', link: '', technologies: [] }])}>Add Project</Button>
      </div>
    );
  }

  const handleChange = (idx: number, field: keyof ProfileData['projects'][0], value: string) => {
    onChange(projects.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleTechChange = (idx: number, value: string) => {
    onChange(projects.map((p, i) => i === idx ? { ...p, technologies: value.split(',').map(s => s.trim()) } : p));
  };

  return (
    <div className="space-y-4">
      {projects.map((proj, idx) => (
        <Card key={idx} className="bg-white/5">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={proj.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'name', e.target.value)} placeholder="Project Name" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
              <input value={proj.link} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'link', e.target.value)} placeholder="Link (optional)" className="bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
            </div>
            <textarea value={proj.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(idx, 'description', e.target.value)} placeholder="Description" rows={3} className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white resize-none" />
            <input value={proj.technologies?.join(', ') || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTechChange(idx, e.target.value)} placeholder="Technologies (comma separated)" className="w-full bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
            <Button variant="ghost" size="sm" onClick={() => onChange(projects.filter((_, i) => i !== idx))}>Remove</Button>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={() => onChange([...projects, { name: '', description: '', link: '', technologies: [] }])}>Add Project</Button>
    </div>
  );
}

export default ProfilePage;