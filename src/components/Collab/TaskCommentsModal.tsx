import React, { useState } from 'react';
import type { Task } from '../../engine/types';
import { useProjectStore } from '../../store';
import { X, Send, MessageSquare, Shield, HardHat } from 'lucide-react';

interface TaskCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export const TaskCommentsModal: React.FC<TaskCommentsModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const { comments, addComment, currentUserRole, setUserRole } = useProjectStore();
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(
    currentUserRole === 'manager' ? 'Site Superintendent' : 'Lead Trade Foreman'
  );

  if (!isOpen || !task) return null;

  const taskComments = comments.filter((c) => c.taskId === task.id);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addComment({
      taskId: task.id,
      author: authorName.trim() || (currentUserRole === 'manager' ? 'PM' : 'Contractor'),
      role: currentUserRole,
      content: content.trim(),
    });
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 font-sans">
      <div className="bg-[#141c2b] border border-[#232f44] rounded-md w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#232f44] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">Site Log & Field Notes</h3>
              <p className="text-[11px] text-slate-400">
                {task.name} ({task.trade})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Switcher Toolbar */}
        <div className="p-3 px-6 bg-[#0f172a] border-b border-[#232f44] flex items-center justify-between text-xs">
          <span className="text-slate-400">Active Role Persona:</span>
          <div className="flex items-center bg-[#141c2b] p-0.5 rounded border border-[#232f44]">
            <button
              onClick={() => {
                setUserRole('manager');
                setAuthorName('Site Superintendent');
              }}
              className={`px-3 py-1 rounded flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                currentUserRole === 'manager'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Project Manager
            </button>
            <button
              onClick={() => {
                setUserRole('contractor');
                setAuthorName('Lead Trade Foreman');
              }}
              className={`px-3 py-1 rounded flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                currentUserRole === 'contractor'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              Trade Contractor
            </button>
          </div>
        </div>

        {/* Comments Feed */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3 bg-[#141c2b]">
          {taskComments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 italic">
              No field notes logged for this task yet. Post the first site note below.
            </div>
          ) : (
            taskComments.map((cm) => {
              const isManager = cm.role === 'manager';
              return (
                <div
                  key={cm.id}
                  className={`p-3 rounded border ${
                    isManager
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-blue-500/5 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      {isManager ? (
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <HardHat className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span>{cm.author}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          isManager
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {isManager ? 'MANAGEMENT' : 'TRADE CREW'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(cm.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-5">{cm.content}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Post Form */}
        <form onSubmit={handlePost} className="p-4 border-t border-[#232f44] bg-[#0f172a]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Post site note as ${authorName}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-[#141c2b] border border-[#232f44] rounded px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Post Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
