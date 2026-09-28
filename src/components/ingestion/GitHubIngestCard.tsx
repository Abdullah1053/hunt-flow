'use client';

import React, { useState } from 'react';
import {
  Search,
  Star,
  GitFork,
  CheckCircle2,
  ExternalLink,
  Code2,
  MapPin,
  Building,
  Globe,
  FileCode,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import { GitHubUserProfile, GitHubRepoItem } from '@/types/ingestion';

interface GitHubIngestCardProps {
  user: GitHubUserProfile | null;
  repos: GitHubRepoItem[];
  selectedRepoIds: number[];
  isLoading: boolean;
  error: string | null;
  onFetchUser: (username: string) => Promise<void>;
  onToggleRepo: (repoId: number) => void;
  onSelectAllNonForks: () => void;
  onSelectTopStarred: () => void;
  onClearRepoSelection: () => void;
}

export const GitHubIngestCard: React.FC<GitHubIngestCardProps> = ({
  user,
  repos,
  selectedRepoIds,
  isLoading,
  error,
  onFetchUser,
  onToggleRepo,
  onSelectAllNonForks,
  onSelectTopStarred,
  onClearRepoSelection,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedReadmeId, setExpandedReadmeId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      onFetchUser(usernameInput.trim());
    }
  };

  const filteredRepos = repos.filter((r) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term)) ||
      (r.language && r.language.toLowerCase().includes(term)) ||
      r.topics.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700/80 text-white">
            <GithubIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">GitHub Repository Aggregator</h2>
            <p className="text-xs text-zinc-400">
              Scrapes public repositories, languages, stargazers & README project summaries
            </p>
          </div>
        </div>
        {user && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected (@{user.login})
          </span>
        )}
      </div>

      {/* Username Form */}
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Enter GitHub handle (e.g. abdullah1053, torvalds)"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !usernameInput.trim()}
          className="px-5 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-600/20"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Fetching...
            </>
          ) : (
            'Ingest GitHub'
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* User Profile Card */}
      {user && (
        <div className="mt-5 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar_url}
              alt={user.login}
              className="h-12 w-12 rounded-xl border border-zinc-700 object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">
                  {user.name || user.login}
                </h3>
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  @{user.login} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {user.bio && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{user.bio}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {user.location}
                  </span>
                )}
                {user.company && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" /> {user.company}
                  </span>
                )}
                {user.blog && (
                  <a
                    href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-zinc-400 hover:text-indigo-300"
                  >
                    <Globe className="h-3 w-3" /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-around sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
            <div className="text-center px-3">
              <span className="text-base font-bold text-white">{user.public_repos}</span>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Repos</span>
            </div>
            <div className="text-center px-3 border-l border-zinc-800">
              <span className="text-base font-bold text-white">
                {repos.reduce((acc, r) => acc + r.stargazers_count, 0)}
              </span>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Stars</span>
            </div>
            <div className="text-center px-3 border-l border-zinc-800">
              <span className="text-base font-bold text-indigo-400">{selectedRepoIds.length}</span>
              <span className="block text-[10px] text-indigo-300 uppercase tracking-wider">Selected</span>
            </div>
          </div>
        </div>
      )}

      {/* Repos Section */}
      {repos.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">
                Showcase Projects for CV Extraction ({selectedRepoIds.length} of {repos.length} selected)
              </h4>
              <p className="text-xs text-zinc-500">
                Select the projects that will be parsed by AI into bullet points and technical highlights
              </p>
            </div>

            {/* Quick selection buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={onSelectTopStarred}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Top Starred
              </button>
              <button
                type="button"
                onClick={onSelectAllNonForks}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                All Originals
              </button>
              <button
                type="button"
                onClick={onClearRepoSelection}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="relative mb-3">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter repositories by name, language, or topic..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Repositories Scrollable List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredRepos.map((repo) => {
              const isSelected = selectedRepoIds.includes(repo.id);
              const isReadmeOpen = expandedReadmeId === repo.id;

              return (
                <div
                  key={repo.id}
                  className={`p-3 rounded-xl border transition ${
                    isSelected
                      ? 'bg-zinc-950/80 border-indigo-500/40 ring-1 ring-indigo-500/20'
                      : 'bg-zinc-950/40 border-zinc-800/70 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleRepo(repo.id)}
                        className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        id={`repo-${repo.id}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor={`repo-${repo.id}`}
                            className="font-medium text-xs sm:text-sm text-zinc-100 hover:text-indigo-300 cursor-pointer truncate"
                          >
                            {repo.name}
                          </label>
                          {repo.is_fork && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">
                              Fork
                            </span>
                          )}
                          {repo.language && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {repo.language}
                            </span>
                          )}
                        </div>

                        {repo.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                            {repo.description}
                          </p>
                        )}

                        {repo.topics && repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {repo.topics.slice(0, 4).map((topic) => (
                              <span
                                key={topic}
                                className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800/80 text-zinc-400"
                              >
                                #{topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {repo.stargazers_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {repo.stargazers_count}
                        </span>
                      )}

                      {repo.readme_summary && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedReadmeId(isReadmeOpen ? null : repo.id)
                          }
                          className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                          title="View parsed README"
                        >
                          <FileCode className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                        title="Open on GitHub"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Collapsible README Excerpt */}
                  {isReadmeOpen && repo.readme_summary && (
                    <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-zinc-800 text-[10px] text-zinc-500 font-sans">
                        <span>Extracted README Preview</span>
                        <span>{repo.readme_summary.length} characters</span>
                      </div>
                      {repo.readme_summary}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
