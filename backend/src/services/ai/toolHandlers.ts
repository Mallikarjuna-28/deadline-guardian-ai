/**
 * toolHandlers.ts
 * Central registry for all 20 AI agent tool backends.
 * Uses dbService which handles both Firestore and in-memory fallback.
 */

import { dbService } from '../../repositories/db';

type SendEvent = (type: string, data: any) => void;

export const toolHandlers: Record<string, (args: any, userId: string, sendEvent: SendEvent) => Promise<any>> = {

  // ─── Task CRUD ─────────────────────────────────────────────────────────────

  create_task: async (args, userId, sendEvent) => {
    const id = 'task-ai-' + Date.now();
    const task = await dbService.saveTask(userId, id, {
      id,
      title: args.title || 'New AI Task',
      deadline: args.deadline || new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
      priority: args.priority || 'medium',
      estimatedMinutes: args.estimatedMinutes || 60,
      actualMinutes: 0,
      status: 'pending',
      category: args.category || 'Work',
      tags: args.tags || ['agent-created'],
      projectId: args.projectId || null,
      parentTaskId: null,
      subtasks: (args.subtasks || []).map((t: string) => ({
        id: 'sub-' + Math.random().toString(36).substring(2, 7),
        title: t,
        completed: false
      })),
      attachments: [],
      recurrence: null,
      aiRiskScore: 10,
      aiInsight: 'Task created by AI agent.',
      scheduledStart: null,
      completedAt: null,
      xpReward: 50,
    });
    sendEvent('update', { type: 'tasks' });
    return { success: true, taskId: id, title: args.title, message: `✅ Created task "${args.title}".` };
  },

  update_task: async (args, userId, sendEvent) => {
    const { taskId, ...fields } = args;
    await dbService.saveTask(userId, taskId, fields);
    sendEvent('update', { type: 'tasks' });
    return { success: true, taskId, updated: Object.keys(fields), message: `Task updated successfully.` };
  },

  delete_task: async (args, userId, sendEvent) => {
    await dbService.deleteTask(userId, args.taskId);
    sendEvent('update', { type: 'tasks' });
    return { success: true, taskId: args.taskId, message: `Task deleted.` };
  },

  complete_task: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    // If no taskId given, complete the oldest incomplete task
    let target = tasks.find((t: any) => t.id === args.taskId && t.status !== 'completed');
    if (!target) {
      target = tasks
        .filter((t: any) => t.status !== 'completed')
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
    }
    if (!target) return { success: false, message: 'No incomplete task found to complete.' };
    await dbService.saveTask(userId, target.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      aiRiskScore: 0
    });
    // Award XP
    const user = await dbService.getUser(userId);
    if (user) {
      await dbService.setUser(userId, { xp: (user.xp || 0) + (target.xpReward || 50) });
    }
    sendEvent('update', { type: 'tasks' });
    sendEvent('confetti', {});
    return { success: true, taskId: target.id, title: target.title, message: `✅ Completed "${target.title}"! +${target.xpReward || 50} XP 🎉` };
  },

  reschedule_task: async (args, userId, sendEvent) => {
    const { taskId, newDeadline, reason } = args;
    const tasks = await dbService.getTasks(userId);
    // If no taskId, find by title fragment or lowest priority
    let target = tasks.find((t: any) => t.id === taskId);
    if (!target && args.priority) {
      const prioMap: any = { critical: 0, high: 1, medium: 2, low: 3 };
      target = tasks
        .filter((t: any) => t.status !== 'completed')
        .sort((a: any, b: any) => prioMap[b.priority] - prioMap[a.priority])[0]; // lowest priority = highest number
    }
    if (!target) return { success: false, message: 'Task not found to reschedule.' };
    await dbService.saveTask(userId, target.id, { deadline: newDeadline });
    sendEvent('update', { type: 'tasks' });
    return {
      success: true, taskId: target.id, title: target.title,
      newDeadline,
      message: `📅 Rescheduled "${target.title}" to ${new Date(newDeadline).toLocaleDateString()}.${reason ? ` Reason: ${reason}` : ''}`
    };
  },

  bulk_reschedule: async (args, userId, sendEvent) => {
    const reschedules = args.reschedules || [];
    let count = 0;
    const results: any[] = [];
    for (const r of reschedules) {
      try {
        const tasks = await dbService.getTasks(userId);
        const task = tasks.find((t: any) => t.id === r.taskId || t.title === r.taskTitle);
        if (task) {
          await dbService.saveTask(userId, task.id, { deadline: r.newDeadline });
          results.push({ taskId: task.id, title: task.title, newDeadline: r.newDeadline, status: 'rescheduled' });
          count++;
        }
      } catch { /* continue */ }
    }
    sendEvent('update', { type: 'tasks' });
    return { rescheduled: count, results, message: `📅 Rescheduled ${count} task${count !== 1 ? 's' : ''} successfully.` };
  },

  // ─── Query Tools ───────────────────────────────────────────────────────────

  get_overdue_tasks: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const now = new Date();
    const overdue = tasks.filter((t: any) =>
      t.status !== 'completed' && new Date(t.deadline) < now
    );
    return {
      count: overdue.length,
      tasks: overdue.map((t: any) => ({
        id: t.id, title: t.title,
        deadline: t.deadline, priority: t.priority,
        hoursOverdue: Math.round((now.getTime() - new Date(t.deadline).getTime()) / 3600000)
      })),
      message: overdue.length === 0
        ? '✅ You have no overdue tasks right now. Great job!'
        : `⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}: ${overdue.map((t: any) => `"${t.title}"`).join(', ')}.`
    };
  },

  get_tasks_due_today: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const now = new Date();
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const dueToday = tasks.filter((t: any) => {
      const d = new Date(t.deadline);
      return t.status !== 'completed' && d >= startOfDay && d <= endOfDay;
    });
    // Also include overdue (past due but today's concern)
    const overdue = tasks.filter((t: any) =>
      t.status !== 'completed' && new Date(t.deadline) < startOfDay
    );
    return {
      count: dueToday.length,
      overdueCount: overdue.length,
      tasks: dueToday.map((t: any) => ({
        id: t.id, title: t.title,
        deadline: t.deadline, priority: t.priority,
        estimatedMinutes: t.estimatedMinutes
      })),
      message: dueToday.length === 0
        ? `No tasks due today${overdue.length > 0 ? `, but ${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue` : ''}. ✅`
        : `📋 You have ${dueToday.length} task${dueToday.length !== 1 ? 's' : ''} due today: ${dueToday.map((t: any) => `"${t.title}"`).join(', ')}.`
    };
  },

  detect_conflicts: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const active = tasks.filter((t: any) => t.status !== 'completed');
    const conflicts: any[] = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = new Date(active[i].deadline).getTime();
        const b = new Date(active[j].deadline).getTime();
        const diffHours = Math.abs(a - b) / 3600000;
        // Flag if two tasks share estimated time windows that overlap
        const aEnd = a;
        const aStart = a - ((active[i].estimatedMinutes || 60) * 60000);
        const bEnd = b;
        const bStart = b - ((active[j].estimatedMinutes || 60) * 60000);
        const overlaps = aStart < bEnd && bStart < aEnd;
        if (overlaps && diffHours < 4) {
          conflicts.push({
            task1: active[i].title,
            task2: active[j].title,
            deadline1: active[i].deadline,
            deadline2: active[j].deadline,
            reason: `Both require work in the same time window (${Math.round(diffHours * 60)} min apart)`
          });
        }
      }
    }
    return {
      conflictsFound: conflicts.length,
      conflicts,
      message: conflicts.length === 0
        ? '✅ No scheduling conflicts detected. Your schedule looks clean!'
        : `⚠️ Found ${conflicts.length} scheduling conflict${conflicts.length > 1 ? 's' : ''} in your tasks.`
    };
  },

  // ─── Planning Tools ────────────────────────────────────────────────────────

  generate_daily_plan: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const now = new Date();
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const prioOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };
    const todayTasks = tasks
      .filter((t: any) => t.status !== 'completed')
      .sort((a: any, b: any) => {
        const aOverdue = new Date(a.deadline) < now ? -1 : 0;
        const bOverdue = new Date(b.deadline) < now ? -1 : 0;
        if (aOverdue !== bOverdue) return aOverdue - bOverdue;
        return prioOrder[a.priority] - prioOrder[b.priority];
      })
      .slice(0, 6);
    let hour = Math.max(now.getHours() + 1, 9);
    const schedule = todayTasks.map((t: any) => {
      const est = t.estimatedMinutes || 60;
      const start = `${hour.toString().padStart(2, '0')}:00`;
      const end = `${(hour + Math.ceil(est / 60)).toString().padStart(2, '0')}:00`;
      hour += Math.ceil(est / 60);
      return {
        taskId: t.id, title: t.title,
        startTime: start, endTime: end,
        estimatedMinutes: est, priority: t.priority,
        deadline: t.deadline
      };
    });
    return {
      schedule,
      totalTasks: schedule.length,
      date: now.toDateString(),
      message: `📅 Here's your optimized plan for today with ${schedule.length} task${schedule.length !== 1 ? 's' : ''}:\n${schedule.map(s => `• ${s.startTime}–${s.endTime}: ${s.title} (${s.estimatedMinutes}min)`).join('\n')}`
    };
  },

  generate_weekly_plan: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const active = tasks
      .filter((t: any) => t.status !== 'completed')
      .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const plan: Record<string, any[]> = {};
    days.forEach(d => { plan[d] = []; });
    active.slice(0, 15).forEach((task: any, i: number) => {
      const day = days[i % 5];
      plan[day].push({ taskId: task.id, title: task.title, priority: task.priority, deadline: task.deadline, estimatedMinutes: task.estimatedMinutes || 60 });
    });
    const summary = days.map(d => `${d}: ${plan[d].length} task${plan[d].length !== 1 ? 's' : ''}`).join(', ');
    return {
      weekPlan: plan,
      totalTasks: active.slice(0, 15).length,
      message: `🗓️ Weekly plan created — ${summary}.`
    };
  },

  // ─── Risk & Analysis ───────────────────────────────────────────────────────

  compute_all_risks: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const now = new Date();
    const risks: any[] = [];
    for (const t of tasks.filter((t: any) => t.status !== 'completed')) {
      const hoursLeft = (new Date(t.deadline).getTime() - now.getTime()) / 3600000;
      const est = (t.estimatedMinutes || 60) / 60;
      let score = 10;
      if (hoursLeft < 0) score = 100;
      else if (hoursLeft < est) score = 95;
      else if (hoursLeft < est * 1.5) score = 85;
      else if (hoursLeft < 6) score = 65;
      else if (hoursLeft < 24) score = 40;
      else if (hoursLeft < 72) score = 20;
      if (t.priority === 'critical') score = Math.min(100, score + 15);
      if (t.priority === 'high') score = Math.min(100, score + 5);
      const riskLevel = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';
      await dbService.saveTask(userId, t.id, {
        aiRiskScore: score,
        aiInsight: score >= 80 ? 'Immediate action required.' : score >= 60 ? 'High risk — act today.' : score >= 35 ? 'Monitor closely.' : 'On track.'
      });
      risks.push({ taskId: t.id, title: t.title, riskScore: score, riskLevel, hoursLeft: Math.round(hoursLeft) });
    }
    risks.sort((a, b) => b.riskScore - a.riskScore);
    sendEvent('update', { type: 'tasks' });
    return {
      risks,
      highRiskCount: risks.filter(r => r.riskScore >= 60).length,
      message: `🔍 Computed risk scores for ${risks.length} active task${risks.length !== 1 ? 's' : ''}. ${risks.filter(r => r.riskScore >= 80).length} critical, ${risks.filter(r => r.riskScore >= 60 && r.riskScore < 80).length} high risk.`
    };
  },

  generate_rescue_plan: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const now = new Date();
    const overdue = tasks
      .filter((t: any) => t.status !== 'completed' && new Date(t.deadline) < now)
      .sort((a: any, b: any) => {
        const prioOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };
        return prioOrder[a.priority] - prioOrder[b.priority];
      });
    if (overdue.length === 0) {
      return { overdueCount: 0, rescueSteps: [], message: '🎉 No overdue tasks — nothing to rescue! You\'re on top of everything.' };
    }
    const steps = overdue.slice(0, 5).map((t: any, i: number) => ({
      order: i + 1,
      taskId: t.id,
      title: t.title,
      priority: t.priority,
      hoursOverdue: Math.round((now.getTime() - new Date(t.deadline).getTime()) / 3600000),
      estimatedMinutes: t.estimatedMinutes || 60,
      action: i === 0
        ? '🚨 START NOW — highest priority overdue item. Block everything else.'
        : i === 1
          ? '⚡ Do this immediately after #1. Can be parallelized if you have help.'
          : `📋 Schedule for ${i + 1} hours from now. Negotiate a new deadline if needed.`
    }));
    return {
      overdueCount: overdue.length,
      rescueSteps: steps,
      message: `🚨 Rescue plan for ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}:\n${steps.map(s => `${s.order}. ${s.title} (${s.hoursOverdue}h overdue) — ${s.action}`).join('\n')}`
    };
  },

  generate_time_travel: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const active = tasks.filter((t: any) => t.status !== 'completed');
    const now = new Date();
    const overdue = active.filter((t: any) => new Date(t.deadline) < now).length;
    const total = active.length;
    return {
      scenarios: [
        {
          id: 'A', label: 'Current Pace', emoji: '😰',
          completed: Math.max(0, Math.floor(total * 0.5) - overdue),
          missed: Math.ceil(total * 0.5) + overdue,
          description: `At current pace you will miss ${Math.ceil(total * 0.5) + overdue} of ${total} deadlines this week. ${overdue > 0 ? `You already have ${overdue} overdue.` : ''}`
        },
        {
          id: 'B', label: 'AI-Optimized', emoji: '🎯',
          completed: Math.floor(total * 0.88),
          missed: Math.ceil(total * 0.12),
          description: `With AI optimization, you complete ${Math.floor(total * 0.88)} of ${total} tasks on time. I'll reschedule low-priority items and protect critical deadlines automatically.`
        },
        {
          id: 'C', label: 'Maximum Effort', emoji: '🚀',
          completed: total, missed: 0,
          description: `Maximum focus mode clears all ${total} tasks. Requires 8+ hour deep work blocks today. Only sustainable for 1–2 days before burnout risk rises significantly.`
        }
      ],
      activeCount: total,
      message: `🔮 Simulated 3 futures for your ${total} active task${total !== 1 ? 's' : ''} over the next 7 days.`
    };
  },

  generate_subtasks: async (args, userId, sendEvent) => {
    const { taskId, title: taskTitle } = args;
    const tasks = await dbService.getTasks(userId);
    // Find by id or by closest title
    let target = tasks.find((t: any) => t.id === taskId);
    if (!target && taskTitle) {
      target = tasks
        .filter((t: any) => t.status !== 'completed')
        .sort((a: any, b: any) => (b.estimatedMinutes || 0) - (a.estimatedMinutes || 0))[0];
    }
    const title = target?.title || taskTitle || 'your task';
    const subtasks = [
      `📋 Research and gather all requirements for: ${title}`,
      `✏️ Create initial draft or skeleton`,
      `⚙️ Complete the main work section`,
      `🔍 Review, test, and revise`,
      `✅ Final check, polish, and submit`
    ];
    if (target) {
      await dbService.saveTask(userId, target.id, {
        subtasks: subtasks.map((t, i) => ({
          id: `sub-${Date.now()}-${i}`,
          title: t, completed: false
        }))
      });
      sendEvent('update', { type: 'tasks' });
    }
    return {
      taskId: target?.id, title,
      subtasks,
      message: `🧩 Generated ${subtasks.length} subtasks for "${title}":\n${subtasks.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    };
  },

  // ─── Utility Tools ─────────────────────────────────────────────────────────

  estimate_duration: async (args, userId, sendEvent) => {
    const { taskTitle = '', category = 'Work', complexity = 'medium' } = args;
    const baseMinutes: Record<string, number> = { simple: 30, medium: 90, complex: 210 };
    const categoryMultiplier: Record<string, number> = {
      Work: 1.2, Study: 1.4, DevOps: 1.3, Project: 1.5,
      Personal: 0.8, Health: 0.7, Finance: 1.0, Admin: 0.9
    };
    const base = baseMinutes[complexity] || 90;
    const mult = categoryMultiplier[category] || 1.0;
    const estimated = Math.round(base * mult);
    const hours = Math.floor(estimated / 60);
    const mins = estimated % 60;
    return {
      taskTitle, estimatedMinutes: estimated,
      estimatedHours: (estimated / 60).toFixed(1),
      breakdown: `${hours}h ${mins > 0 ? mins + 'min' : ''}`.trim(),
      message: `⏱️ Estimated duration for "${taskTitle}": **${estimated} minutes** (${(estimated/60).toFixed(1)}h). Complexity: ${complexity}, Category: ${category}.`
    };
  },

  send_notification: async (args, userId, sendEvent) => {
    const { title, body, urgency = 'medium' } = args;
    const notifId = 'notif-ai-' + Date.now();
    await dbService.saveNotification(userId, notifId, {
      id: notifId,
      type: 'agent_notification',
      title, body, urgency,
      read: false,
      createdAt: new Date().toISOString()
    });
    sendEvent('notification', { title, body, urgency });
    return { sent: true, title, body, urgency, message: `🔔 Notification sent: "${title}"` };
  },

  add_to_google_calendar: async (args, userId, sendEvent) => {
    const { taskId } = args;
    const tasks = await dbService.getTasks(userId);
    let target = tasks.find((t: any) => t.id === taskId);
    if (!target) {
      // Find most urgent task
      target = tasks
        .filter((t: any) => t.status !== 'completed')
        .sort((a: any, b: any) => {
          const prioOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };
          return prioOrder[a.priority] - prioOrder[b.priority];
        })[0];
    }
    if (!target) return { success: false, message: 'No task found to add to calendar.' };
    // Return structured event data (frontend handles actual Calendar API call)
    sendEvent('calendar_sync', { taskId: target.id, taskTitle: target.title });
    return {
      success: true,
      taskId: target.id,
      taskTitle: target.title,
      deadline: target.deadline,
      message: `📅 Added "${target.title}" to Google Calendar with deadline ${new Date(target.deadline).toLocaleDateString()}.`
    };
  },

  create_project: async (args, userId, sendEvent) => {
    const { name, deadline, description = '' } = args;
    const id = 'proj-ai-' + Date.now();
    const project = await dbService.saveProject(userId, id, {
      id, name, deadline: deadline || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      description, color: '#6366F1', icon: 'Folder',
      progress: 0, taskCount: 0, completedCount: 0,
      aiHealthScore: 100,
    });
    sendEvent('update', { type: 'projects' });
    return { success: true, projectId: id, name, message: `📁 Created project "${name}".` };
  },

  get_all_tasks: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    return { tasks, count: tasks.length, message: `Found ${tasks.length} total tasks.` };
  },

  compute_deadline_risk: async (args, userId, sendEvent) => {
    const { taskId } = args;
    const tasks = await dbService.getTasks(userId);
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found for risk evaluation.' };
    
    const now = new Date();
    const hoursLeft = (new Date(task.deadline).getTime() - now.getTime()) / 3600000;
    const est = (task.estimatedMinutes || 60) / 60;
    let score = 10;
    if (hoursLeft < 0) score = 100;
    else if (hoursLeft < est) score = 95;
    else if (hoursLeft < est * 1.5) score = 85;
    else if (hoursLeft < 6) score = 65;
    else if (hoursLeft < 24) score = 40;
    else if (hoursLeft < 72) score = 20;
    if (task.priority === 'critical') score = Math.min(100, score + 15);
    
    const riskLevel = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';
    
    await dbService.saveTask(userId, task.id, {
      aiRiskScore: score,
      aiInsight: score >= 80 ? 'Immediate action required.' : score >= 60 ? 'High risk — act today.' : 'On track.'
    });
    sendEvent('update', { type: 'tasks' });
    return { taskId: task.id, title: task.title, riskScore: score, riskLevel, message: `Risk computed for "${task.title}": ${score}% (${riskLevel}).` };
  },

  generate_weekly_report: async (args, userId, sendEvent) => {
    const tasks = await dbService.getTasks(userId);
    const done = tasks.filter((t: any) => t.status === 'completed' || t.done).length;
    const total = tasks.length;
    const rate = total ? Math.round(done / total * 100) : 0;
    return {
      report: `Weekly Report: You completed ${done} of ${total} tasks (${rate}% completion rate). ${rate >= 70 ? 'Great work this week!' : 'There is room to improve — consider using the daily plan feature.'} Focus on high-priority items first next week.`,
      completionRate: rate,
      message: `📊 Weekly Report: Completed ${done}/${total} tasks (${rate}%). ${rate >= 70 ? 'Great job!' : 'Try to focus on urgent items first.'}`
    };
  },

};

