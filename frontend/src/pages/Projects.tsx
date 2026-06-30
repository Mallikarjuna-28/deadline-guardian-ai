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
      <div className="flex justify-between items-center border-b border-[#E2DFFF] pb-4">
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-[#1A1635]">Projects Hub</h1>
          <p className="text-xs text-[#8B87A8]">Coordinate tasks into target hubs with AI health scoring.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B4CF5] hover:bg-[#4A3DE0] text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Project Adding Form overlay */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-[#E2DFFF] shadow-[0_8px_30px_rgba(91,76,245,0.06)] space-y-4 animate-fadeIn max-w-xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#8B87A8] tracking-wider">Project Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Thesis Launch"
                className="w-full bg-white border border-[#E2DFFF] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4CF5] text-[#1A1635]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#8B87A8] tracking-wider">Target Completion</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white border border-[#E2DFFF] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4CF5] text-[#1A1635]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#8B87A8] tracking-wider">Scope / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe targets and milestones..."
              className="w-full h-20 bg-white border border-[#E2DFFF] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B4CF5] text-[#1A1635] resize-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] uppercase font-bold text-[#8B87A8] tracking-wider">Hub Theme Color</label>
            <div className="flex gap-2">
              {['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#10B981'].map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-[#5B4CF5] scale-110' : 'border-transparent opacity-75'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E2DFFF]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 rounded-lg border border-[#E2DFFF] text-xs text-[#4A4568] hover:bg-[#F0EFFF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#5B4CF5] hover:bg-[#4A3DE0] text-white font-semibold text-xs"
            >
              Initialize Project
            </button>
          </div>
        </form>
      )}

      {/* Active projects list */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center text-center text-[#8B87A8] text-sm gap-2">
            <Folder className="w-8 h-8 opacity-40 text-[#5B4CF5] animate-bounce" />
            <span>Create your first Project Hub to categorize tasks!</span>
          </div>
        ) : (
          projects.map(proj => {
            const projectTasks = tasks.filter(t => t.projectId === proj.id);
            const total = projectTasks.length;
            const completed = projectTasks.filter(t => t.status === 'completed').length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            return (
              <div key={proj.id} className="rounded-2xl bg-white border border-[#E2DFFF] shadow-[0_8px_30px_rgba(91,76,245,0.06)] p-5 space-y-4 hover:border-[#5B4CF5] transition-all flex flex-col justify-between group">
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: proj.color || '#4F46E5' }}
                      />
                      <h3 className="font-display font-semibold text-base text-[#1A1635] group-hover:text-[#5B4CF5] transition-colors">
                        {proj.name}
                      </h3>
                    </div>
                    
                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-[#8B87A8] hover:text-red-600 transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-[#4A4568] leading-relaxed min-h-[36px]">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#E2DFFF]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8B87A8]">Progress:</span>
                    <span className="font-mono font-bold text-[#1A1635]">{progress}% ({completed}/{total})</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F0EFFF] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: proj.color || '#4F46E5'
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#8B87A8] pt-1">
                    <span className="flex items-center gap-1">
                      📅 Due: {new Date(proj.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#5B4CF5] bg-[#EDE9FF] px-2 py-0.5 rounded border border-[#C5BFFF]">
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
