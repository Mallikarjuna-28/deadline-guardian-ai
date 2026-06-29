import React, { useEffect, useState } from 'react';
import { useProjectStore, Project } from '../stores/useProjectStore';
import { useTaskStore } from '../stores/useTaskStore';
import { Folder, Plus, Target, Flame, AlertCircle, Trash2 } from 'lucide-react';

export default function Projects() {
  const { projects, fetchProjects, createProject, deleteProject } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#4F46E5');

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createProject({
      name,
      description,
      deadline: deadline || new Date(Date.now() + 3600 * 1000 * 24 * 10).toISOString(),
      color,
      icon: 'Folder'
    });

    setName('');
    setDescription('');
    setDeadline('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add button triggers */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-200">Projects Hub</h1>
          <p className="text-xs text-gray-500">Coordinate tasks into target hubs with AI health scoring.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-indigo hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Project Adding Form overlay */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl glass border border-white/10 space-y-4 animate-fadeIn max-w-xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Project Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Thesis Launch"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Target Completion</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Scope / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe targets and milestones..."
              className="w-full h-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-indigo text-gray-200 resize-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Hub Theme Color</label>
            <div className="flex gap-2">
              {['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#10B981'].map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent opacity-75'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
            >
              Initialize Project
            </button>
          </div>
        </form>
      )}

      {/* Active projects list */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center text-center text-gray-500 text-sm gap-2">
            <Folder className="w-8 h-8 opacity-40 text-brand-indigo animate-bounce" />
            <span>Create your first Project Hub to categorize tasks!</span>
          </div>
        ) : (
          projects.map(proj => {
            const projectTasks = tasks.filter(t => t.projectId === proj.id);
            const total = projectTasks.length;
            const completed = projectTasks.filter(t => t.status === 'completed').length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            return (
              <div key={proj.id} className="rounded-2xl glass p-5 space-y-4 hover:border-indigo-500/10 transition-all flex flex-col justify-between group">
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: proj.color || '#4F46E5' }}
                      />
                      <h3 className="font-display font-semibold text-base text-gray-200 group-hover:text-indigo-400 transition-colors">
                        {proj.name}
                      </h3>
                    </div>
                    
                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed min-h-[36px]">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Progress:</span>
                    <span className="font-mono font-bold text-gray-300">{progress}% ({completed}/{total})</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: proj.color || '#4F46E5'
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      📅 Due: {new Date(proj.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      🎯 Health: {proj.aiHealthScore || 90}%
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
