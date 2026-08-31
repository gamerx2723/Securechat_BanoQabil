import React, { useState, useEffect } from 'react';
import { User, Users, Plus, X, Shield, Search } from 'lucide-react';
import { ApiClient } from '../api/client';

interface NewChatModalProps {
  onClose: () => void;
  onCreated: (newConv: any) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onClose: _close, onCreated }) => {
  const [users, setUsers] = useState<Array<{ id: string; username: string; displayName: string; role: string }>>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.getDirectoryUsers().then(setUsers);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectUser = (id: string) => {
    if (isGroup) {
      if (selectedUserIds.includes(id)) {
        setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
      } else {
        setSelectedUserIds([...selectedUserIds, id]);
      }
    } else {
      setSelectedUserIds([id]);
    }
  };

  const handleCreate = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one contact.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const conv = await ApiClient.createConversation({
        type: isGroup ? 'GROUP' : 'DIRECT',
        title: isGroup ? groupTitle || 'New Secure Group' : undefined,
        participantUserIds: selectedUserIds,
      });
      onCreated(conv);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Start New Secure Chat</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-4 border border-slate-700/50">
          <button
            type="button"
            onClick={() => { setIsGroup(false); setSelectedUserIds([]); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              !isGroup ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Direct 1:1 Chat
          </button>
          <button
            type="button"
            onClick={() => { setIsGroup(true); setSelectedUserIds([]); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              isGroup ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Secure Group
          </button>
        </div>

        {isGroup && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Group Channel Name</label>
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g. Threat Intel Team"
              className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directory by username..."
            className="w-full bg-slate-950 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {error && <div className="text-xs text-rose-400 mb-2">{error}</div>}

        {/* Directory List */}
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">No other registered users found</div>
          ) : (
            filteredUsers.map((u) => {
              const selected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleSelectUser(u.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    selected
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{u.displayName}</div>
                      <div className="text-[11px] text-slate-400">@{u.username} &bull; <span className="text-cyan-400">E2EE Verified</span></div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-slate-600'}`}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || selectedUserIds.length === 0}
            className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            {loading ? 'Creating...' : 'Open Secure Channel'}
          </button>
        </div>
      </div>
    </div>
  );
};
