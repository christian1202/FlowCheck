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

  // Autocomplete state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cache, setCache] = useState<Record<string, any[]>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canManage = currentUserRole === 'owner' || currentUserRole === 'editor';

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (!email || email.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const query = email.trim();
    
    // Check cache
    if (cache[query]) {
      setSearchResults(cache[query]);
      setShowDropdown(true);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const debounceTimer = setTimeout(async () => {
      const result = await searchAdmins(query, eventId);
      if (result.data) {
        setSearchResults(result.data);
        setCache(prev => ({ ...prev, [query]: result.data }));
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(debounceTimer);
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
      case 'owner': return <Shield className="w-4 h-4 text-primary" />;
      case 'editor': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'scanner': return <QrCode className="w-4 h-4 text-green-600" />;
      default: return null;
    }
  };

  return (
    <div className="bg-surface-container-lowest shadow-sm sm:rounded-xl border border-surface-container-high overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-surface-container-highest">
        <h3 className="text-lg leading-6 font-headline-md font-bold text-primary flex items-center">
          <UserPlus className="w-5 h-5 mr-2" />
          Team & Scanners
        </h3>
        <p className="mt-1 max-w-2xl text-sm font-body-sm text-on-surface-variant">
          Invite staff to help manage this event or scan attendees at the door.
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Invite Form */}
        {canManage && (
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end bg-surface-container p-4 rounded-lg overflow-visible">
            <div className="flex-1 w-full relative" ref={dropdownRef}>
              <label htmlFor="invite-email" className="block text-sm font-medium text-on-surface mb-1">Email Address</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => { if (email.length >= 2) setShowDropdown(true); }}
                  placeholder="Search by name or email..."
                  required
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-surface border border-surface-container-highest rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center space-x-2 text-on-surface-variant">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul className="py-1">
                      {searchResults.map((user) => (
                        <li 
                          key={user.id}
                          onClick={() => handleSelectUser(user.email)}
                          className="px-4 py-2 hover:bg-surface-container cursor-pointer flex flex-col"
                        >
                          <span className="text-sm font-medium text-on-surface">{user.fullName || 'No name'}</span>
                          <span className="text-xs text-on-surface-variant">{user.email}</span>
                        </li>
                      ))}
                    </ul>
                  ) : email.length >= 2 ? (
                    <div className="p-4 text-sm text-on-surface-variant text-center">
                      No matching users found.<br/>
                      <span className="text-xs">They must create an account first.</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            
            <div className="w-full sm:w-48">
              <label htmlFor="invite-role" className="block text-sm font-medium text-on-surface mb-1">Role</label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'scanner')}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
              >
                <option value="scanner">Scanner</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-on-primary rounded-md shadow-sm font-medium hover:bg-tertiary-container disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Invite'}
            </button>
          </form>
        )}

        {message && (
          <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-[#e7f5e8] text-[#1e4620]' : 'bg-error-container text-on-error-container'}`}>
            {message.text}
          </div>
        )}

        {/* Team List */}
        <div>
          <h4 className="font-label-sm font-semibold text-on-surface mb-3">Current Team Members</h4>
          <div className="border border-surface-container-highest rounded-md overflow-hidden">
            <ul className="divide-y divide-surface-container-highest">
              {initialTeam.map((member) => (
                <li key={member.adminId} className="px-4 py-3 flex items-center justify-between hover:bg-surface-container-lowest transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold">
                      {member.fullName ? member.fullName[0].toUpperCase() : member.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {member.fullName || 'No name'}
                        {member.adminId === currentAdminId && <span className="ml-2 text-xs font-normal text-on-surface-variant">(You)</span>}
                      </p>
                      <p className="text-xs text-on-surface-variant">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-sm text-on-surface-variant capitalize">
                      {getRoleIcon(member.role)}
                      <span className="ml-1">{member.role}</span>
                    </div>
                    {canManage && member.adminId !== currentAdminId && !(currentUserRole === 'editor' && member.role === 'owner') && (
                      <button
                        onClick={() => handleRemove(member.adminId)}
                        className="text-error hover:bg-error-container p-2 rounded-full transition-colors"
                        title="Remove member"
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
