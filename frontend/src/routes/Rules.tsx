import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  GitBranch,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Play,
  CheckCircle,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { queryClient } from '../lib/query-client.js';
import { toast } from 'sonner';

export default function Rules() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0);
  const [conditions, setConditions] = useState<any[]>([{ field: 'sender', operator: 'contains', value: '' }]);
  const [actions, setActions] = useState<any[]>([{ type: 'label', config: { labelName: 'Triaged' } }]);

  // Load rules list
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiRequest('/rules'),
  });

  // Action mutations
  const createRuleMutation = useMutation({
    mutationFn: (newRule: any) => 
      apiRequest('/rules', {
        method: 'POST',
        body: JSON.stringify(newRule),
      }),
    onSuccess: () => {
      toast.success('New matching rule created!');
      handleCloseBuilder();
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: any }) => 
      apiRequest(`/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rule),
      }),
    onSuccess: () => {
      toast.success('Rule successfully updated.');
      handleCloseBuilder();
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Triage rule deleted.');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest(`/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setEditingRule(null);
    setName('');
    setDescription('');
    setPriority(0);
    setConditions([{ field: 'sender', operator: 'contains', value: '' }]);
    setActions([{ type: 'label', config: { labelName: 'Triaged' } }]);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setName(rule.name);
    setDescription(rule.description || '');
    setPriority(rule.priority);
    try {
      setConditions(JSON.parse(rule.conditions));
      setActions(JSON.parse(rule.actions));
    } catch (_) {
      setConditions([{ field: 'sender', operator: 'contains', value: '' }]);
      setActions([{ type: 'label', config: { labelName: 'Triaged' } }]);
    }
    setShowBuilder(true);
  };

  const handleAddCondition = () => {
    setConditions(prev => [...prev, { field: 'subject', operator: 'contains', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleConditionChange = (index: number, key: string, val: string) => {
    setConditions(prev =>
      prev.map((cond, idx) => (idx === index ? { ...cond, [key]: val } : cond))
    );
  };

  const handleActionChange = (index: number, key: string, val: any) => {
    setActions(prev =>
      prev.map((act, idx) => {
        if (idx === index) {
          if (key === 'type') {
            return { type: val, config: val === 'label' ? { labelName: 'Triaged' } : {} };
          }
          if (key === 'labelName') {
            return { ...act, config: { ...act.config, labelName: val } };
          }
          if (key === 'taskPriority') {
            return { ...act, config: { ...act.config, taskPriority: val } };
          }
        }
        return act;
      })
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a rule name.');
      return;
    }

    const payload = {
      name,
      description,
      priority,
      conditions,
      actions,
    };

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, rule: payload });
    } else {
      createRuleMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Triage Rules</h1>
          <p className="text-slate-400 text-sm mt-1 font-sans">Manage filters that automatically organize, label, and create tasks for emails.</p>
        </div>
        {!showBuilder && (
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition"
          >
            <Plus className="h-4 w-4" />
            Create Rule
          </button>
        )}
      </div>

      {/* Rules list or Builder Panel */}
      {showBuilder ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900 shadow-xl overflow-hidden p-6 space-y-6 max-w-3xl animate-slide-in">
          {/* Builder Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white font-sans">
              {editingRule ? 'Edit Triage Rule' : 'Build Custom Rule'}
            </h2>
            <button onClick={handleCloseBuilder} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Core Name/Desc Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">Rule Name</label>
              <input
                type="text"
                placeholder="Amazon Receipts routing..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">Execution Priority</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">Description</label>
              <input
                type="text"
                placeholder="Short explanation of rule actions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
              />
            </div>
          </div>

          {/* Condition Builder Block (AND list) */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conditions (Matched as AND)</h3>
              <button
                type="button"
                onClick={handleAddCondition}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                Add Condition
              </button>
            </div>

            <div className="space-y-3">
              {conditions.map((cond, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                  <select
                    value={cond.field}
                    onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium focus:outline-none"
                  >
                    <option value="sender">Sender (From)</option>
                    <option value="domain">Sender Domain</option>
                    <option value="subject">Subject</option>
                    <option value="body">Email Body</option>
                    <option value="label">Gmail Label</option>
                    <option value="attachment">Attachment</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium focus:outline-none"
                  >
                    <option value="contains">contains</option>
                    <option value="starts_with">starts with</option>
                    <option value="ends_with">ends with</option>
                    <option value="equals">equals</option>
                    <option value="regex">matches regex</option>
                    <option value="exists">exists</option>
                  </select>

                  {cond.operator !== 'exists' && (
                    <input
                      type="text"
                      placeholder="matching text..."
                      value={cond.value}
                      onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs focus:outline-none focus:border-slate-700"
                    />
                  )}

                  {conditions.length > 1 && (
                    <button
                      onClick={() => handleRemoveCondition(index)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Builder Block */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Execute Actions</h3>
            <div className="space-y-3">
              {actions.map((act, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                  <select
                    value={act.type}
                    onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium focus:outline-none"
                  >
                    <option value="label">Apply Label</option>
                    <option value="create_task">Create Notion Task</option>
                    <option value="create_reminder">Create Calendar Event</option>
                    <option value="mark_review">Queue for Review</option>
                    <option value="ignore">Ignore (Auto archive)</option>
                    <option value="star">Star Email</option>
                  </select>

                  {/* Config fields depending on action type */}
                  {act.type === 'label' && (
                    <input
                      type="text"
                      placeholder="Label name..."
                      value={act.config?.labelName || ''}
                      onChange={(e) => handleActionChange(index, 'labelName', e.target.value)}
                      className="w-48 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs focus:outline-none focus:border-slate-700"
                    />
                  )}

                  {act.type === 'create_task' && (
                    <select
                      value={act.config?.taskPriority || 'medium'}
                      onChange={(e) => handleActionChange(index, 'taskPriority', e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs focus:outline-none"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Priority</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Builder Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              onClick={handleCloseBuilder}
              className="px-4 py-2 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/10"
            >
              <Save className="h-4 w-4" />
              Save Rule
            </button>
          </div>
        </div>
      ) : (
        /* Rules Listing Cards Grid */
        <div className="space-y-4 max-w-4xl">
          {isLoading ? (
            <div className="text-slate-500 text-sm p-10 text-center">Loading rules...</div>
          ) : rules.length > 0 ? (
            rules.map((rule: any) => {
              let parsedConditions: any[] = [];
              let parsedActions: any[] = [];
              try {
                parsedConditions = JSON.parse(rule.conditions);
                parsedActions = JSON.parse(rule.actions);
              } catch (_) {}

              return (
                <div key={rule.id} className="rounded-2xl border border-slate-800/80 bg-slate-900 p-5 flex items-start justify-between gap-6 shadow-lg hover:border-slate-700/80 transition-all duration-200">
                  <div className="space-y-3 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-base tracking-tight">{rule.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-bold">
                        P{rule.priority}
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs">{rule.description || 'No description provided.'}</p>

                    {/* Conditions lists */}
                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <div className="flex items-start gap-1.5 text-xs">
                        <span className="text-slate-500 font-semibold uppercase tracking-wider w-16">IF</span>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedConditions.map((cond, idx) => (
                            <span key={idx} className="bg-slate-950 border border-slate-850 px-2.5 py-0.5 rounded text-[11px] text-slate-300 font-medium">
                              {cond.field} <span className="text-slate-500">{cond.operator}</span> {cond.value || 'exists'}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions list */}
                      <div className="flex items-start gap-1.5 text-xs">
                        <span className="text-slate-500 font-semibold uppercase tracking-wider w-16">THEN</span>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedActions.map((act, idx) => (
                            <span key={idx} className="bg-blue-600/10 border border-blue-500/20 px-2.5 py-0.5 rounded text-[11px] text-blue-400 font-semibold">
                              {act.type.replace(/_/g, ' ')}
                              {act.config?.labelName ? ` (${act.config.labelName})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side options toggles */}
                  <div className="flex flex-col items-end gap-4 flex-shrink-0 self-stretch justify-between">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      className="text-slate-400 hover:text-white"
                    >
                      {rule.isActive ? (
                        <ToggleRight className="h-7 w-7 text-blue-500" />
                      ) : (
                        <ToggleLeft className="h-7 w-7" />
                      )}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-[10px] font-semibold text-slate-400 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-900 bg-slate-950 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400"
                        title="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center border border-slate-800/80 rounded-2xl bg-slate-900 text-slate-500 text-sm">
              <GitBranch className="h-10 w-10 mx-auto mb-2 opacity-50 text-indigo-400" />
              <p className="font-semibold text-slate-350">No Triage Rules Created</p>
              <p className="text-xs text-slate-500">Create rules to automate repetitive inbox classification actions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
