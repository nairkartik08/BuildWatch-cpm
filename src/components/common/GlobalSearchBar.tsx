import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store';
import { Search, Package, HardHat, AlertTriangle, CheckSquare, X } from 'lucide-react';

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
        className="flex items-center gap-2 bg-[#0f172a] border border-[#232f44] hover:border-slate-600 px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">Search project items...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
          ⌘K
        </kbd>
      </button>

      {/* Modal Dialog rendered into document.body with createPortal */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 p-4 bg-slate-950/80"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-[#141c2b] border border-[#232f44] rounded-lg w-full max-w-xl shadow-xl overflow-hidden flex flex-col z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input Bar */}
              <div className="p-4 px-5 border-b border-[#232f44] flex items-center gap-3 bg-[#0f172a]">
                <Search className="w-4 h-4 text-blue-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search tasks, materials, contractors, delays..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 border-0 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700 cursor-pointer hover:bg-slate-700 hover:text-white"
                >
                  ESC
                </kbd>
              </div>

              {/* Results list */}
              <div className="p-2 max-h-96 overflow-y-auto divide-y divide-[#232f44] bg-[#141c2b]">
                {results.length > 0 ? (
                  results.map((hit) => {
                    let Icon = CheckSquare;
                    if (hit.category === 'Delivery') Icon = Package;
                    else if (hit.category === 'Contractor') Icon = HardHat;
                    else if (hit.category === 'Delay') Icon = AlertTriangle;

                    return (
                      <div
                        key={hit.id}
                        onClick={hit.action}
                        className="p-3 rounded hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center gap-3 group"
                      >
                        <div className="p-2 rounded bg-slate-800 text-blue-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs truncate group-hover:text-blue-400 transition-colors">
                              {hit.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                              {hit.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {hit.subtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : query.trim() ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No matching items found for "{query}".
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Type to search across tasks, deliveries, contractors, and active delays.
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
