import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, ClipboardList } from 'lucide-react';

export interface AgentAction {
  id: string;
  label: string;
  reason: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  status?: 'pending' | 'approved' | 'rejected' | 'executing' | 'done';
}

export function AgentActions({
  actions,
  onExecute,
}: {
  actions: AgentAction[];
  onExecute: (action: AgentAction) => Promise<void>;
}) {
  const [statuses, setStatuses] = useState<Record<string, AgentAction['status']>>(
    Object.fromEntries(actions.map(a => [a.id, 'pending']))
  );

  async function approve(action: AgentAction) {
    setStatuses(s => ({ ...s, [action.id]: 'executing' }));
    try {
      await onExecute(action);
      setStatuses(s => ({ ...s, [action.id]: 'done' }));
    } catch {
      setStatuses(s => ({ ...s, [action.id]: 'pending' }));
    }
  }

  function reject(id: string) {
    setStatuses(s => ({ ...s, [id]: 'rejected' }));
  }

  async function approveAll() {
    for (const action of actions) {
      if (statuses[action.id] === 'pending') {
        await approve(action);
      }
    }
  }

  function rejectAll() {
    const next: Record<string, AgentAction['status']> = {};
    actions.forEach(a => { next[a.id] = 'rejected'; });
    setStatuses(next);
  }

  const hasPending = actions.some(a => statuses[a.id] === 'pending');

  return (
    <div className="mt-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/50 overflow-hidden animate-fadeIn">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-indigo-400" />
        <p className="text-sm font-semibold text-indigo-300">
          I want to make {actions.length} change{actions.length !== 1 ? 's' : ''} — your approval:
        </p>
      </div>

      <div className="divide-y divide-white/5">
        {actions.map((action, i) => {
          const status = statuses[action.id];
          return (
            <div
              key={action.id}
              className="px-4 py-3 flex items-start gap-3"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="text-gray-500">Reason: </span>{action.reason}
                </p>
              </div>

              <div className="flex-shrink-0 mt-0.5">
                {status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => approve(action)}
                      className="px-2.5 py-1 text-xs font-semibold bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-all flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => reject(action.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-all flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
                {status === 'executing' && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Executing...
                  </div>
                )}
                {status === 'done' && (
                  <span className="text-xs font-semibold text-green-400 bg-green-500/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Done
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="text-xs font-semibold text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">
                    ✗ Skipped
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasPending && (
        <div className="px-4 py-3 border-t border-white/5 flex gap-2">
          <button
            onClick={approveAll}
            className="flex-1 py-2 text-sm font-semibold bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
          >
            ✓ Approve All
          </button>
          <button
            onClick={rejectAll}
            className="flex-1 py-2 text-sm font-semibold bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors"
          >
            ✗ Reject All
          </button>
        </div>
      )}
    </div>
  );
}
