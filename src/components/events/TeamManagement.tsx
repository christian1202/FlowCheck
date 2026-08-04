'use client';

import { useState, useEffect, useRef } from 'react';
import { addEventAdmin, removeEventAdmin, searchAdmins } from '@/actions/eventAdmins';
import { UserPlus, Trash2, Shield, Eye, QrCode, Loader2, Search } from 'lucide-react';

export type TeamMember = {
  adminId: string;
  email: string;
  fullName: string | null;
  role: 'owner' | 'editor' | 'scanner';
};

export type SearchResultUser = {
  id: string;
  email: string;
  fullName: string | null;
};

interface TeamManagementProps {
  eventId: string;
  initialTeam: TeamMember[];
  currentUserRole: 'owner' | 'editor' | 'scanner';
  currentAdminId: string;
}

export default function TeamManagement({ eventId, initialTeam, currentUserRole, currentAdminId }: TeamManagementProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'scanner'>('scanner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cache, setCache] = useState<Record<string, SearchResultUser[]>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canManage = currentUserRole === 'owner' || currentUserRole === 'editor';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const trimmed = val.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
    } else if (cache[trimmed]) {
      setSearchResults(cache[trimmed]);
      setShowDropdown(true);
    } else {
      setIsSearching(true);
      setShowDropdown(true);
    }
  };

  useEffect(() => {
    const query = email.trim();
    if (!query || query.length < 2 || cache[query]) {
      return;
    }

    let isCancelled = false;
    const debounceTimer = setTimeout(async () => {
      const result = await searchAdmins(query, eventId);
      if (!isCancelled) {
        if (result.data) {
          setSearchResults(result.data);
          setCache(prev => ({ ...prev, [query]: result.data }));
        }
        setIsSearching(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [email, eventId, cache]);

  const handleSelectUser = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setShowDropdown(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setShowDropdown(false);
    setIsSubmitting(true);
    setMessage(null);

    const result = await addEventAdmin(eventId, email, role);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: `Successfully added ${email} as ${role}.` });
      setEmail('');
    }
    setIsSubmitting(false);
  };

  const handleRemove = async (targetAdminId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    setMessage(null);
    const result = await removeEventAdmin(eventId, targetAdminId);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Team member removed.' });
    }
  };

  const getRoleIcon = (r: string) => {
    switch(r) {
      case 'owner': return <Shield className="w-4 h-4 text-amber-400" />;
      case 'editor': return <Eye className="w-4 h-4 text-indigo-400" />;
      case 'scanner': return <QrCode className="w-4 h-4 text-emerald-400" />;
      default: return null;
    }
  };

  return (
    <div className="claude-card rounded-3xl border border-white/10 shadow-xl overflow-hidden text-slate-100">
      <div className="px-6 py-4 border-b border-white/10 bg-slate-950/60">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>Team & Scanner Assignments</span>
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Assign event staff, editors, and door scanners for this stream.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Invite Form */}
        {canManage && (
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-950/60 p-4 rounded-2xl border border-white/10">
            <div className="flex-1 w-full relative" ref={dropdownRef}>
              <label htmlFor="invite-email" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onFocus={() => { if (email.length >= 2) setShowDropdown(true); }}
                  placeholder="Search name or email..."
                  required
                  autoComplete="off"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono transition-colors transform-gpu"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/15 rounded-xl shadow-2xl max-h-60 overflow-y-auto hide-scrollbar">
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center space-x-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="text-xs font-mono">Searching users...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul className="py-1">
                      {searchResults.map((user) => (
                        <li 
                          key={user.id}
                          onClick={() => handleSelectUser(user.email)}
                          className="px-4 py-2.5 hover:bg-white/10 cursor-pointer flex flex-col border-b border-white/5 last:border-0"
                        >
                          <span className="text-xs font-bold text-white">{user.fullName || 'No name'}</span>
                          <span className="text-xs font-mono text-slate-400">{user.email}</span>
                        </li>
                      ))}
                    </ul>
                  ) : email.length >= 2 ? (
                    <div className="p-4 text-xs font-mono text-slate-400 text-center">
                      No registered user found.<br/>
                      <span className="text-[11px] text-slate-500">They must register an account first.</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            
            <div className="w-full sm:w-44">
              <label htmlFor="invite-role" className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Role</label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'scanner')}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500/50 transition-colors transform-gpu"
              >
                <option value="scanner">Scanner</option>
                <option value="editor">Editor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors transition-transform transform-gpu shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50 active-scale"
            >
              {isSubmitting ? 'Adding...' : 'Invite Staff'}
            </button>
          </form>
        )}

        {message && (
          <div className={`p-3.5 rounded-2xl text-xs font-mono border ${message.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-red-950/60 text-red-300 border-red-500/30'}`}>
            {message.text}
          </div>
        )}

        {/* Team List */}
        <div>
          <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Assigned Staff ({initialTeam.length})</h4>
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40">
            <ul className="divide-y divide-white/10">
              {initialTeam.map((member) => (
                <li key={member.adminId} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono font-bold text-xs shrink-0">
                      {member.fullName ? member.fullName[0].toUpperCase() : member.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {member.fullName || 'No name'}
                        {member.adminId === currentAdminId && <span className="ml-2 text-xs font-mono text-amber-400">(You)</span>}
                      </p>
                      <p className="text-xs font-mono text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 uppercase tracking-wider">
                      {getRoleIcon(member.role)}
                      <span>{member.role}</span>
                    </div>
                    {canManage && member.adminId !== currentAdminId && !(currentUserRole === 'editor' && member.role === 'owner') && (
                      <button
                        onClick={() => handleRemove(member.adminId)}
                        className="text-red-400 hover:bg-red-500/10 p-2.5 rounded-xl transition-colors active-scale"
                        title="Remove member"
                        aria-label={`Remove ${member.fullName || member.email} from team`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
