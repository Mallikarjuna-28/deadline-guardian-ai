import React, { useEffect, useState } from 'react';
import { useTaskStore, Task } from '../stores/useTaskStore';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';

const getGoogleCalendarUrl = (task: Task) => {
  const title = encodeURIComponent(task.title);
  const details = encodeURIComponent(
    `Deadline Guardian AI Task\nPriority: ${task.priority.toUpperCase()}\nRisk Score: ${task.aiRiskScore || 0}%\nEstimated Duration: ${task.estimatedMinutes || 60} minutes.`
  );
  
  const deadlineDate = new Date(task.deadline);
  const durationMinutes = task.estimatedMinutes || 60;
  const startDate = new Date(deadlineDate.getTime() - durationMinutes * 60 * 1000);
  
  const startDateStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDateStr = deadlineDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}`;
};

export default function Calendar() {
  const { tasks, fetchTasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, []);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate calendar dates logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const totalDays = getDaysInMonth(year, month);
  const startDayOffset = getFirstDayOfMonth(year, month);

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyPreCells = Array.from({ length: startDayOffset }, (_, i) => null);

  const calendarGrid = [...emptyPreCells, ...daysArray];

  // Match tasks for a specific calendar cell
  const getTasksForDate = (dayNum: number) => {
    return tasks.filter(t => {
      const dDate = new Date(t.deadline);
      return dDate.getDate() === dayNum &&
        dDate.getMonth() === month &&
        dDate.getFullYear() === year;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Header Navigation */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-200">Calendar view</h1>
          <p className="text-xs text-gray-500">Track deadlines, schedule times blocks, and inspect scheduling overlaps.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-semibold text-sm text-gray-300 w-32 text-center select-none">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-2xl glass border border-indigo-950/40 p-4 overflow-hidden">
        
        {/* Days of week titles */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* Days grids */}
        <div className="grid grid-cols-7 gap-2 mt-2">
          {calendarGrid.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[90px] bg-white/[0.01] rounded-lg border border-transparent" />;
            }

            const dayTasks = getTasksForDate(day);
            const isToday = new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[100px] p-2 bg-white/5 border rounded-lg flex flex-col justify-between group transition-all ${
                  isToday
                    ? 'border-brand-indigo ring-1 ring-brand-indigo'
                    : 'border-white/5 hover:border-indigo-500/25'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-mono font-bold ${isToday ? 'text-brand-indigo bg-white px-1.5 py-0.2 rounded' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
                  )}
                </div>

                <div className="space-y-1.5 mt-2 flex-1 flex flex-col justify-end">
                  {dayTasks.slice(0, 2).map(task => {
                    const color = task.priority === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                      task.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' :
                      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25';
                    
                    return (
                      <div
                        key={task.id}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center justify-between gap-1 border group/task ${color}`}
                        title={task.title}
                      >
                        <span className="truncate flex-1">{task.title}</span>
                        <a
                          href={getGoogleCalendarUrl(task)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover/task:opacity-100 transition-opacity hover:text-white"
                          title="Add to Google Calendar"
                        >
                          📅
                        </a>
                      </div>
                    );
                  })}
                  {dayTasks.length > 2 && (
                    <div className="text-[8px] text-gray-500 font-bold text-center">
                      + {dayTasks.length - 2} more tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
