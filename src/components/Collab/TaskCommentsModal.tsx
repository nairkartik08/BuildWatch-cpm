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
  if (!isOpen || !task) return null;

  const { comments, addComment, currentUserRole, setUserRole } = useProjectStore();
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(
    currentUserRole === 'manager' ? 'Site Superintendent' : 'Lead Trade Foreman'
  );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121926] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-[#ffb020]">
              <MessageSquare className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">Task Collaboration & Field Notes</h3>
              <p className="text-[11px] text-[#8e9ab0]">
                {task.name} ({task.trade})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8e9ab0] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Switcher Toolbar */}
        <div className="p-3 px-6 bg-black/30 border-b border-white/5 flex items-center justify-between text-xs">
          <span className="text-[#8e9ab0]">Active Role Persona:</span>
          <div className="flex items-center bg-white/5 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setUserRole('manager');
                setAuthorName('Site Superintendent');
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                currentUserRole === 'manager'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-[#8e9ab0] hover:text-white'
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
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                currentUserRole === 'contractor'
                  ? 'bg-blue-500 text-black font-bold shadow'
                  : 'text-[#8e9ab0] hover:text-white'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              Trade Contractor
            </button>
          </div>
        </div>

        {/* Comments Feed */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {taskComments.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#8e9ab0] italic">
              No field notes logged for this task yet. Post the first update below!
            </div>
          ) : (
            taskComments.map((cm) => {
              const isManager = cm.role === 'manager';
              return (
                <div
                  key={cm.id}
                  className={`p-3 rounded-xl border ${
                    isManager
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-blue-500/5 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      {isManager ? (
                        <Shield className="w-3.5 h-3.5 text-[#ffb020]" />
                      ) : (
                        <HardHat className="w-3.5 h-3.5 text-[#4da3ff]" />
                      )}
                      <span>{cm.author}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          isManager
                            ? 'bg-amber-500/20 text-[#ffb020]'
                            : 'bg-blue-500/20 text-[#4da3ff]'
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
        <form onSubmit={handlePost} className="p-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Post field note as ${authorName}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-[#0b0f16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ffb020]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ffb020] text-black hover:bg-amber-400 flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
