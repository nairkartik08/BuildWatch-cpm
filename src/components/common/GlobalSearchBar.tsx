import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store';
import { Search, Package, HardHat, CircleAlert, CheckSquare, X } from 'lucide-react';

export const GlobalSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, deliveries, contractors, delays, setSelectedTaskId } = useProjectStore();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const hits: {
      id: string;
      title: string;
      category: 'Task' | 'Delivery' | 'Contractor' | 'Delay';
      subtitle: string;
      action: () => void;
    }[] = [];

    // Search Tasks
    for (const t of tasks) {
      if (
        t.name.toLowerCase().includes(q) ||
        t.trade.toLowerCase().includes(q) ||
        t.site.toLowerCase().includes(q)
      ) {
        hits.push({
          id: t.id,
          title: t.name,
          category: t.isDelivery ? 'Delivery' : 'Task',
          subtitle: `${t.trade} · ${t.site}`,
          action: () => {
            setSelectedTaskId(t.id);
            navigate('/app/tasks');
            setIsOpen(false);
          },
        });
      }
    }

    // Search Deliveries
    for (const d of deliveries) {
      if (
        d.material.toLowerCase().includes(q) ||
        d.supplier.toLowerCase().includes(q)
      ) {
        hits.push({
          id: d.id,
          title: d.material,
          category: 'Delivery',
          subtitle: `Supplier: ${d.supplier} · Expected: Day ${d.expectedArrival}`,
          action: () => {
            setSelectedTaskId(`task-${d.id}`);
            navigate('/app/tasks');
            setIsOpen(false);
          },
        });
      }
    }

    // Search Contractors
    for (const c of contractors) {
      if (c.name.toLowerCase().includes(q) || c.trade.toLowerCase().includes(q)) {
        hits.push({
          id: c.id,
          title: c.name,
          category: 'Contractor',
          subtitle: `Trade: ${c.trade} · Reliability: ${c.reliability}x`,
          action: () => {
            navigate('/app/tasks');
            setIsOpen(false);
          },
        });
      }
    }

    // Search Delays
    for (const d of delays) {
      const relatedTask = tasks.find((t) => t.id === d.taskId);
      if (
        d.cause.toLowerCase().includes(q) ||
        (d.note && d.note.toLowerCase().includes(q)) ||
        (relatedTask && relatedTask.name.toLowerCase().includes(q))
      ) {
        hits.push({
          id: d.id,
          title: `Delay: +${d.days}d on ${relatedTask?.name || d.taskId}`,
          category: 'Delay',
          subtitle: `Cause: ${d.cause} ${d.note ? `· ${d.note}` : ''}`,
          action: () => {
            setSelectedTaskId(d.taskId);
            navigate('/app');
            setIsOpen(false);
          },
        });
      }
    }

    return hits.slice(0, 10);
  }, [query, tasks, deliveries, contractors, delays, navigate, setSelectedTaskId]);

  return (
    <>
      {/* Search trigger button in header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#121823] border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-xl text-xs text-[#8e9ab0] hover:text-white transition-all shadow-sm cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 text-[#ffb020]" />
        <span className="hidden sm:inline">Search anything...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400">
          ⌘K
        </kbd>
      </button>

      {/* Modal Dialog rendered into document.body with createPortal */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-[#121926] border border-white/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input Bar */}
              <div className="p-4 px-5 border-b border-white/10 flex items-center gap-3 bg-[#0d121c]">
                <Search className="w-5 h-5 text-[#ffb020] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type to search tasks, deliveries, contractors, delays..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-0 border-0 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-slate-400 border border-white/10 cursor-pointer hover:bg-white/10 hover:text-white"
                >
                  ESC
                </kbd>
              </div>

              {/* Results list */}
              <div className="p-2 max-h-96 overflow-y-auto divide-y divide-white/5 bg-[#121926]">
                {results.length > 0 ? (
                  results.map((hit) => {
                    let Icon = CheckSquare;
                    if (hit.category === 'Delivery') Icon = Package;
                    else if (hit.category === 'Contractor') Icon = HardHat;
                    else if (hit.category === 'Delay') Icon = CircleAlert;

                    return (
                      <div
                        key={hit.id}
                        onClick={hit.action}
                        className="p-3 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors flex items-center gap-3 group"
                      >
                        <div className="p-2 rounded-lg bg-white/5 text-[#ffb020] group-hover:scale-105 transition-transform shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs truncate group-hover:text-[#ffb020] transition-colors">
                              {hit.title}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                              {hit.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8e9ab0] truncate mt-0.5">
                            {hit.subtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : query.trim() ? (
                  <div className="p-8 text-center text-xs text-[#8e9ab0]">
                    No matching tasks, deliveries, or contractors found for "{query}".
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#8e9ab0]">
                    Type to search across 35+ tasks, 6 deliveries, 5 contractors, and active delay slips.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
