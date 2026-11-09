'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Database,
  Sparkles,
  Zap,
  Briefcase,
  FolderGit2,
  Server,
  Users,
  Award,
  GraduationCap,
  Trash2,
  Edit3,
  ExternalLink,
  Globe,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Tag,
  Calendar,
  MapPin,
  Loader2,
  Send,
  ArrowUpRight,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import {
  CareerTrackEntry,
  CareerTrackCategory,
  CAREER_CATEGORY_CONFIG,
} from '@/types/careerTrack';
import { MasterCvProfile, WorkExperienceItem, ProjectItem } from '@/types/masterCv';
import { AiProviderConfig } from '@/types/aiConfig';

interface CareerTrackViewProps {
  masterProfile: MasterCvProfile;
  onUpdateMasterProfile: (updated: MasterCvProfile, isDiscrete?: boolean) => void;
  aiConfig?: AiProviderConfig;
  onNavigateToStudio?: () => void;
}

const CATEGORY_ICONS: Record<CareerTrackCategory, React.ComponentType<{ className?: string }>> = {
  work_experience: Briefcase,
  project: FolderGit2,
  infrastructure_security: Server,
  leadership_mentorship: Users,
  certification_award: Award,
  general_achievement: GraduationCap,
};

export const CareerTrackView: React.FC<CareerTrackViewProps> = ({
  masterProfile,
  onUpdateMasterProfile,
  aiConfig,
  onNavigateToStudio,
}) => {
  const [entries, setEntries] = useState<CareerTrackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<CareerTrackCategory>('work_experience');
  const [formTitle, setFormTitle] = useState('');
  const [formOrganization, setFormOrganization] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formRawNotes, setFormRawNotes] = useState('');
  const [formBullets, setFormBullets] = useState<string[]>([]);
  const [newBulletText, setNewBulletText] = useState('');
  const [formTechTags, setFormTechTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [formGithubUrl, setFormGithubUrl] = useState('');
  const [formDemoUrl, setFormDemoUrl] = useState('');
  const [formCertUrl, setFormCertUrl] = useState('');

  // AI conversion loading
  const [isConvertingAi, setIsConvertingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const [copiedBulletId, setCopiedBulletId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // 1. Fetch entries from SQLite on mount
  useEffect(() => {
    async function loadEntries() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/db/career-track');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.entries)) {
            setEntries(data.entries);
          }
        }
      } catch (err) {
        console.error('Failed to load career track entries:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadEntries();
  }, []);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Category filter
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = entry.title.toLowerCase().includes(query);
        const inOrg = entry.organization.toLowerCase().includes(query);
        const inNotes = entry.rawNotes?.toLowerCase().includes(query) ?? false;
        const inTags = entry.techTags.some((t) => t.toLowerCase().includes(query));
        const inBullets = entry.bullets.some((b) => b.toLowerCase().includes(query));
        if (!inTitle && !inOrg && !inNotes && !inTags && !inBullets) {
          return false;
        }
      }

      return true;
    });
  }, [entries, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    entries.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [entries]);

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingEntryId(null);
    setFormCategory('work_experience');
    setFormTitle('');
    setFormOrganization('');
    setFormLocation('');
    setFormStartDate('');
    setFormEndDate('');
    setFormRawNotes('');
    setFormBullets([]);
    setNewBulletText('');
    setFormTechTags([]);
    setNewTagInput('');
    setFormGithubUrl('');
    setFormDemoUrl('');
    setFormCertUrl('');
    setAiError(null);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (entry: CareerTrackEntry) => {
    setEditingEntryId(entry.id);
    setFormCategory(entry.category);
    setFormTitle(entry.title);
    setFormOrganization(entry.organization);
    setFormLocation(entry.location || '');
    setFormStartDate(entry.startDate || '');
    setFormEndDate(entry.endDate || '');
    setFormRawNotes(entry.rawNotes || '');
    setFormBullets([...entry.bullets]);
    setNewBulletText('');
    setFormTechTags([...entry.techTags]);
    setNewTagInput('');
    setFormGithubUrl(entry.links?.githubUrl || '');
    setFormDemoUrl(entry.links?.demoUrl || '');
    setFormCertUrl(entry.links?.certificateUrl || '');
    setAiError(null);
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formOrganization.trim()) {
      alert('Please fill in Title and Organization.');
      return;
    }

    const payload: Partial<CareerTrackEntry> = {
      id: editingEntryId || undefined,
      category: formCategory,
      title: formTitle.trim(),
      organization: formOrganization.trim(),
      location: formLocation.trim() || undefined,
      startDate: formStartDate.trim() || undefined,
      endDate: formEndDate.trim() || undefined,
      rawNotes: formRawNotes.trim() || undefined,
      bullets: formBullets.filter((b) => b.trim().length > 0),
      techTags: formTechTags.filter((t) => t.trim().length > 0),
      links: {
        githubUrl: formGithubUrl.trim() || undefined,
        demoUrl: formDemoUrl.trim() || undefined,
        certificateUrl: formCertUrl.trim() || undefined,
      },
    };

    try {
      const isEdit = Boolean(editingEntryId);
      const url = '/api/db/career-track';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: payload }),
      });

      if (!res.ok) {
        throw new Error('Failed to save career track entry');
      }

      const data = await res.json();
      if (data?.entry) {
        if (isEdit) {
          setEntries((prev) =>
            prev.map((item) => (item.id === data.entry.id ? data.entry : item))
          );
          showToast('Career milestone updated successfully!');
        } else {
          setEntries((prev) => [data.entry, ...prev]);
          showToast('New career milestone saved to Vault!');
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving entry');
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from your Career Vault?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/db/career-track?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete entry');

      setEntries((prev) => prev.filter((item) => item.id !== id));
      showToast('Milestone deleted from Vault.');
    } catch (err: any) {
      alert(err.message || 'Error deleting entry');
    }
  };

  // AI Convert Raw Notes to XYZ Bullet
  const handleConvertRawNotesToBullet = async () => {
    if (!formRawNotes.trim()) {
      setAiError('Please enter some context or raw notes first.');
      return;
    }

    setIsConvertingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/cv/optimize-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet: formRawNotes.trim(),
          context: `${formTitle} at ${formOrganization} (${formCategory})`,
          aiConfig,
          apiKey: aiConfig?.apiKey,
        }),
      });

      if (!res.ok) {
        throw new Error('AI optimization service returned an error');
      }

      const data = await res.json();
      if (data?.optimizedBullet) {
        setFormBullets((prev) => [...prev, data.optimizedBullet]);
        showToast('Generated XYZ ATS bullet from notes!');
      } else {
        throw new Error('No bullet was generated');
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate bullet. Check your AI Configuration.');
    } finally {
      setIsConvertingAi(false);
    }
  };

  // Add bullet to form
  const handleAddBulletToForm = () => {
    if (!newBulletText.trim()) return;
    setFormBullets((prev) => [...prev, newBulletText.trim()]);
    setNewBulletText('');
  };

  // Add tag to form
  const handleAddTagToForm = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim().replace(/^,+|,+$/g, '');
    if (clean && !formTechTags.includes(clean)) {
      setFormTechTags((prev) => [...prev, clean]);
    }
    setNewTagInput('');
  };

  // 1-Click Action: Send to CV Experience
  const handleSendToCvExperience = (entry: CareerTrackEntry) => {
    const existingIdx = masterProfile.experience.findIndex(
      (e) => e.company.trim().toLowerCase() === entry.organization.trim().toLowerCase()
    );

    let updatedExperience = [...masterProfile.experience];
    const candidateBullets =
      entry.bullets.length > 0
        ? entry.bullets
        : [entry.rawNotes || `Engineered core systems at ${entry.organization}.`];

    if (existingIdx !== -1) {
      const existingExp = updatedExperience[existingIdx];
      const existingBulletsLower = new Set(
        existingExp.bullets.map((b) => b.trim().toLowerCase())
      );
      const newUniqueBullets = candidateBullets.filter(
        (b) => !existingBulletsLower.has(b.trim().toLowerCase())
      );

      if (newUniqueBullets.length === 0) {
        showToast(`Bullets for ${entry.organization} are already present in CV.`, 'info');
        return;
      }

      updatedExperience[existingIdx] = {
        ...existingExp,
        bullets: [...existingExp.bullets, ...newUniqueBullets],
      };
      showToast(`Appended ${newUniqueBullets.length} bullet(s) to ${entry.organization} in CV!`);
    } else {
      const newExp: WorkExperienceItem = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        company: entry.organization,
        role: entry.title,
        location: entry.location || 'Remote',
        startDate: entry.startDate || '2023',
        endDate: entry.endDate || 'Present',
        isCurrent: entry.endDate?.toLowerCase().includes('present') ?? false,
        bullets: candidateBullets,
      };
      updatedExperience = [newExp, ...updatedExperience];
      showToast(`Added ${entry.organization} role to Active CV Experience!`);
    }

    const updatedProfile: MasterCvProfile = {
      ...masterProfile,
      experience: updatedExperience,
      metadata: {
        ...masterProfile.metadata,
        lastEditedAt: new Date().toISOString(),
      },
    };

    onUpdateMasterProfile(updatedProfile, true);
  };

  // 1-Click Action: Send to CV Projects
  const handleSendToCvProjects = (entry: CareerTrackEntry) => {
    const candidateBullets =
      entry.bullets.length > 0
        ? entry.bullets
        : [entry.rawNotes || `Designed and deployed ${entry.title}.`];

    const newProject: ProjectItem = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: entry.title,
      role: entry.organization && entry.organization !== 'Project' ? entry.organization : undefined,
      techStack: entry.techTags || [],
      githubUrl: entry.links?.githubUrl,
      demoUrl: entry.links?.demoUrl,
      startDate: entry.startDate,
      endDate: entry.endDate,
      bullets: candidateBullets,
    };

    const updatedProfile: MasterCvProfile = {
      ...masterProfile,
      projects: [newProject, ...masterProfile.projects],
      metadata: {
        ...masterProfile.metadata,
        lastEditedAt: new Date().toISOString(),
      },
    };

    onUpdateMasterProfile(updatedProfile, true);
    showToast(`Added "${entry.title}" to Active CV Projects!`);
  };

  // 1-Click Action: Add Tech Tags to CV Skills
  const handleAddTagsToSkills = (entry: CareerTrackEntry) => {
    if (!entry.techTags || entry.techTags.length === 0) {
      showToast('No tech tags to add.', 'info');
      return;
    }

    const existingSkills = masterProfile.skills;
    const lowerLangs = new Set(existingSkills.languages.map((s) => s.toLowerCase()));
    const lowerFw = new Set(existingSkills.frameworks.map((s) => s.toLowerCase()));
    const lowerDb = new Set(existingSkills.databases.map((s) => s.toLowerCase()));
    const lowerDevops = new Set(existingSkills.devopsAndCloud.map((s) => s.toLowerCase()));
    const lowerTools = new Set(existingSkills.toolsAndConcepts.map((s) => s.toLowerCase()));

    const KNOWN_LANGUAGES = ['typescript', 'javascript', 'python', 'php', 'golang', 'go', 'java', 'c++', 'c#', 'rust', 'ruby', 'sql', 'html', 'css', 'bash', 'shell'];
    const KNOWN_FRAMEWORKS = ['react', 'reactjs', 'next.js', 'nextjs', 'vue', 'vuejs', 'angular', 'laravel', 'express', 'node.js', 'nodejs', 'django', 'fastapi', 'flask', 'nest.js', 'nestjs', 'spring', 'tailwind', 'tailwindcss', 'redux'];
    const KNOWN_DATABASES = ['mysql', 'postgresql', 'postgres', 'sqlite', 'redis', 'mongodb', 'mariadb', 'dynamodb', 'elasticsearch'];
    const KNOWN_DEVOPS = ['aws', 'ec2', 's3', 'rds', 'iam', 'docker', 'kubernetes', 'k8s', 'nginx', 'caddy', 'pm2', 'linux', 'ci/cd', 'github actions', 'cloudflare', 'gcp', 'azure'];

    const newSkills = {
      languages: [...existingSkills.languages],
      frameworks: [...existingSkills.frameworks],
      databases: [...existingSkills.databases],
      devopsAndCloud: [...existingSkills.devopsAndCloud],
      toolsAndConcepts: [...existingSkills.toolsAndConcepts],
    };

    let addedCount = 0;
    entry.techTags.forEach((tag) => {
      const clean = tag.trim();
      const lower = clean.toLowerCase();
      if (
        lowerLangs.has(lower) ||
        lowerFw.has(lower) ||
        lowerDb.has(lower) ||
        lowerDevops.has(lower) ||
        lowerTools.has(lower)
      ) {
        return;
      }

      if (KNOWN_LANGUAGES.some((k) => lower.includes(k))) {
        newSkills.languages.push(clean);
        lowerLangs.add(lower);
        addedCount++;
      } else if (KNOWN_FRAMEWORKS.some((k) => lower.includes(k))) {
        newSkills.frameworks.push(clean);
        lowerFw.add(lower);
        addedCount++;
      } else if (KNOWN_DATABASES.some((k) => lower.includes(k))) {
        newSkills.databases.push(clean);
        lowerDb.add(lower);
        addedCount++;
      } else if (KNOWN_DEVOPS.some((k) => lower.includes(k))) {
        newSkills.devopsAndCloud.push(clean);
        lowerDevops.add(lower);
        addedCount++;
      } else {
        newSkills.toolsAndConcepts.push(clean);
        lowerTools.add(lower);
        addedCount++;
      }
    });

    if (addedCount === 0) {
      showToast('All tech tags are already present in Active CV Skills.', 'info');
      return;
    }

    const updatedProfile: MasterCvProfile = {
      ...masterProfile,
      skills: newSkills,
      metadata: {
        ...masterProfile.metadata,
        lastEditedAt: new Date().toISOString(),
      },
    };

    onUpdateMasterProfile(updatedProfile, true);
    showToast(`Merged ${addedCount} new skill(s) into Active CV Skills!`);
  };

  const copyBulletToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletId(id);
    setTimeout(() => setCopiedBulletId(null), 1800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner">
                <Database className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Career Track & Achievements Vault
              </h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-800 text-purple-300 border border-zinc-700">
                {entries.length} Milestones
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Permanent store of your full career milestones, production systems, and raw achievements.
              Push any item to your active CV with a single click.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToStudio && (
              <button
                type="button"
                onClick={onNavigateToStudio}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 transition"
              >
                <span>Open CV Builder</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-lg shadow-purple-500/20 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Career Milestone</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, organization, tag, or notes..."
              className="w-full pl-10 pr-10 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              All ({categoryCounts['all'] || 0})
            </button>

            {(Object.keys(CAREER_CATEGORY_CONFIG) as CareerTrackCategory[]).map((cat) => {
              const cfg = CAREER_CATEGORY_CONFIG[cat];
              const count = categoryCounts[cat] || 0;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? `${cfg.badgeClass} shadow-sm font-bold`
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  {cfg.shortLabel} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Milestones Grid / List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-xs">Loading Career Vault milestones...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-400">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Career Milestones Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            {searchQuery
              ? `No milestones matched your search query "${searchQuery}". Try clearing the search or category filter.`
              : 'Add your first career achievement, project, or infrastructure milestone to the Vault.'}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 px-3 py-1.5 text-xs rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 text-zinc-950"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Milestone</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEntries.map((entry) => {
            const catConfig = CAREER_CATEGORY_CONFIG[entry.category] || CAREER_CATEGORY_CONFIG.work_experience;
            const CategoryIcon = CATEGORY_ICONS[entry.category] || Briefcase;
            const isNotesExpanded = Boolean(expandedNotes[entry.id]);

            return (
              <div
                key={entry.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catConfig.badgeClass}`}
                      >
                        <CategoryIcon className="h-3 w-3" />
                        {catConfig.label}
                      </span>

                      {entry.startDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          {entry.startDate} {entry.endDate ? `– ${entry.endDate}` : ''}
                        </span>
                      )}

                      {entry.location && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                          <MapPin className="h-3 w-3 text-zinc-500" />
                          {entry.location}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {entry.title}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                      {entry.organization}
                    </p>
                  </div>

                  {/* Top-Right Card Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-start">
                    {/* External links */}
                    {entry.links?.githubUrl && (
                      <a
                        href={entry.links.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        title="GitHub Repository"
                      >
                        <GithubIcon className="h-4 w-4" />
                      </a>
                    )}
                    {entry.links?.demoUrl && (
                      <a
                        href={entry.links.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        title="Live Demo"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                    {entry.links?.certificateUrl && (
                      <a
                        href={entry.links.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        title="Certificate URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(entry)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                      title="Edit Milestone"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id, entry.title)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete Milestone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Bullets List */}
                {entry.bullets && entry.bullets.length > 0 && (
                  <div className="space-y-1.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
                      <span>Resume-Ready Bullets ({entry.bullets.length})</span>
                    </div>
                    <ul className="space-y-1.5">
                      {entry.bullets.map((bullet, bIdx) => {
                        const bulletKey = `${entry.id}_b_${bIdx}`;
                        const isCopied = copiedBulletId === bulletKey;
                        return (
                          <li
                            key={bIdx}
                            className="group flex items-start justify-between gap-2 text-xs text-zinc-300 leading-relaxed"
                          >
                            <span className="flex-1">
                              <span className="text-purple-400 mr-2 font-bold">•</span>
                              {bullet}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyBulletToClipboard(bullet, bulletKey)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                              title="Copy bullet"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Raw Story / Context Notes (Collapsible) */}
                {entry.rawNotes && (
                  <div className="text-xs text-zinc-400 bg-zinc-950/30 border border-zinc-800/50 rounded-xl p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedNotes((prev) => ({
                          ...prev,
                          [entry.id]: !prev[entry.id],
                        }))
                      }
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-400 hover:text-zinc-200"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        Full Context / Backstory Notes
                      </span>
                      {isNotesExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {isNotesExpanded && (
                      <p className="mt-2 text-zinc-300 whitespace-pre-wrap leading-relaxed pt-2 border-t border-zinc-800">
                        {entry.rawNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Tech Tags */}
                {entry.techTags && entry.techTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {entry.techTags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom 1-Click "Push to Active CV" Action Bar */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* + Send to CV Experience */}
                    <button
                      type="button"
                      onClick={() => handleSendToCvExperience(entry)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition shadow-sm"
                      title="Append to CV Experience (creates entry or merges bullets into existing company)"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>+ Send to CV Experience</span>
                    </button>

                    {/* + Send to CV Projects */}
                    <button
                      type="button"
                      onClick={() => handleSendToCvProjects(entry)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition shadow-sm"
                      title="Append to CV Projects"
                    >
                      <FolderGit2 className="h-3.5 w-3.5" />
                      <span>+ Send to CV Projects</span>
                    </button>

                    {/* + Add Tech Tags to CV Skills */}
                    {entry.techTags && entry.techTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAddTagsToSkills(entry)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition shadow-sm"
                        title="Merge tech tags into CV Skills"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>+ Add Tags to CV Skills</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-400 hidden md:inline">
                    Synced with SQLite
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingEntryId ? 'Edit Career Milestone' : 'Add New Career Milestone'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Store this milestone permanently in your Vault.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEntry} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Category & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CareerTrackCategory)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {(Object.keys(CAREER_CATEGORY_CONFIG) as CareerTrackCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CAREER_CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Title / Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Full-Stack Developer or E-Commerce Platform"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Organization & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Organization / Company / Platform *
                  </label>
                  <input
                    type="text"
                    required
                    value={formOrganization}
                    onChange={(e) => setFormOrganization(e.target.value)}
                    placeholder="e.g., Doing Platform, Client, or Open Source"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g., Sana'a, Yemen or Remote"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    placeholder="e.g., Mar 2023"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="text"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    placeholder="e.g., Present or Dec 2024"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Links (GitHub, Demo, Certificate) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formGithubUrl}
                    onChange={(e) => setFormGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Demo / Live URL
                  </label>
                  <input
                    type="url"
                    value={formDemoUrl}
                    onChange={(e) => setFormDemoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Certificate URL
                  </label>
                  <input
                    type="url"
                    value={formCertUrl}
                    onChange={(e) => setFormCertUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Tech Tags Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tech Stack / Skills Tags
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-950 border border-zinc-800 rounded-xl min-h-[42px]">
                  {formTechTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-zinc-800 text-purple-300 border border-zinc-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          setFormTechTags((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddTagToForm();
                        }
                      }}
                      placeholder="Type skill & press Enter..."
                      className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                    {newTagInput && (
                      <button
                        type="button"
                        onClick={handleAddTagToForm}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Raw Notes with AI Converter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Raw Context & Story Notes
                  </label>
                  <button
                    type="button"
                    onClick={handleConvertRawNotesToBullet}
                    disabled={isConvertingAi || !formRawNotes.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition disabled:opacity-40"
                    title="Generate an action-verb XYZ bullet from raw story notes"
                  >
                    {isConvertingAi ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Converting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span>⚡ Convert Raw Notes to XYZ Bullet (AI)</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={formRawNotes}
                  onChange={(e) => setFormRawNotes(e.target.value)}
                  placeholder="Freeform context: write the full story, problem solved, scale metrics, architectural choices, and lessons learned..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />

                {aiError && (
                  <p className="text-[11px] text-rose-400 font-medium">{aiError}</p>
                )}
              </div>

              {/* Resume-Ready Bullets List */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Resume-Ready XYZ Bullets ({formBullets.length})
                </label>

                {formBullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold mt-2">•</span>
                    <textarea
                      rows={2}
                      value={b}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormBullets((prev) =>
                          prev.map((item, i) => (i === idx ? val : item))
                        );
                      }}
                      className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormBullets((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-zinc-500 hover:text-rose-400 mt-1"
                      title="Remove bullet"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* Add new bullet row */}
                <div className="flex items-start gap-2 pt-1">
                  <textarea
                    rows={2}
                    value={newBulletText}
                    onChange={(e) => setNewBulletText(e.target.value)}
                    placeholder="Add an ATS-optimized bullet (Action Verb + Context + Quantifiable Metric)..."
                    className="flex-1 px-3 py-1.5 bg-zinc-950/70 border border-dashed border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBulletToForm}
                    disabled={!newBulletText.trim()}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-40 transition mt-1"
                  >
                    Add Bullet
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-md shadow-purple-500/20 transition"
                >
                  {editingEntryId ? 'Update Milestone' : 'Save to Career Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
