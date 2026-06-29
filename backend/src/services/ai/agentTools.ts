// Function declaration schemas for Gemini Function Calling

export const agentToolDeclarations = [
  {
    name: 'create_task',
    description: 'Creates a new task for the user with title, deadline, priority, and estimated minutes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'The title of the task.' },
        deadline: { type: 'STRING', description: 'ISO 8601 string of the deadline.' },
        priority: { 
          type: 'STRING', 
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Task priority level.'
        },
        estimatedMinutes: { type: 'INTEGER', description: 'Estimated time to complete in minutes.' },
        category: { type: 'STRING', description: 'The task category, e.g. Work, Study, Health, Personal.' },
        subtasks: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'A list of subtask titles to pre-create.'
        }
      },
      required: ['title', 'deadline', 'priority']
    }
  },
  {
    name: 'get_all_tasks',
    description: 'Retrieves all tasks for the current user including pending, overdue, and completed.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'complete_task',
    description: 'Marks a specific task as completed by ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'The unique task ID.' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'delete_task',
    description: 'Deletes a specific task by ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'The unique task ID.' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'reschedule_task',
    description: 'Reschedules a task by updating its deadline and calculating an AI explanation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'The unique task ID.' },
        newDeadline: { type: 'STRING', description: 'New ISO 8601 string deadline.' },
        reason: { type: 'STRING', description: 'The rationale or context behind rescheduling.' }
      },
      required: ['taskId', 'newDeadline', 'reason']
    }
  },
  {
    name: 'create_project',
    description: 'Creates a new project tracking hub.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Name of the project.' },
        deadline: { type: 'STRING', description: 'ISO 8601 target completion deadline.' },
        description: { type: 'STRING', description: 'Project overview and scope.' }
      },
      required: ['name', 'deadline']
    }
  },
  {
    name: 'generate_daily_plan',
    description: 'Generates an optimized hourly schedule calendar for the user\'s current day.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'compute_deadline_risk',
    description: 'Performs a deep diagnostic risk calculation on a task, outputting a risk score.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'The ID of the task to calculate risk score for.' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'generate_subtasks',
    description: 'Generates concrete subtask steps to break down a larger task by name.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'The ID of the task to generate subtasks for.' },
        title: { type: 'STRING', description: 'The title of the task.' }
      },
      required: ['taskId', 'title']
    }
  },
  // --- 11 NEW AGENT TOOLS ---
  {
    name: 'get_overdue_tasks',
    description: 'Get all tasks that have passed their deadline and are not completed.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'get_tasks_due_today',
    description: 'Get all tasks due today that need immediate attention.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'bulk_reschedule',
    description: 'Reschedule multiple tasks at once to reduce user overload.',
    parameters: {
      type: 'OBJECT',
      properties: {
        reschedules: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              taskId: { type: 'STRING' },
              taskTitle: { type: 'STRING' },
              newDeadline: { type: 'STRING', description: 'ISO 8601 datetime' },
              reason: { type: 'STRING' }
            }
          }
        }
      },
      required: ['reschedules']
    }
  },
  {
    name: 'detect_conflicts',
    description: 'Find scheduling conflicts where tasks overlap in the same time window.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'generate_weekly_plan',
    description: 'Generate an optimized plan distributing all tasks across the entire week.',
    parameters: {
      type: 'OBJECT',
      properties: {
        weekStart: { type: 'STRING', description: 'ISO date string of the Monday' }
      },
      required: ['weekStart']
    }
  },
  {
    name: 'compute_all_risks',
    description: 'Recalculate AI deadline risk scores for every active task simultaneously.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'generate_time_travel',
    description: 'Simulate 3 future deadline scenarios: current pace, AI-optimized, and maximum effort.',
    parameters: {
      type: 'OBJECT',
      properties: {
        horizonDays: { type: 'NUMBER', description: 'Days to simulate ahead' }
      },
      required: ['horizonDays']
    }
  },
  {
    name: 'generate_rescue_plan',
    description: 'Create an emergency recovery plan for overdue tasks with specific time blocks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        overdueTaskIds: { type: 'ARRAY', items: { type: 'STRING' } }
      },
      required: ['overdueTaskIds']
    }
  },
  {
    name: 'add_to_google_calendar',
    description: 'Create a Google Calendar event for a specific task.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING' },
        taskTitle: { type: 'STRING' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'estimate_duration',
    description: 'Use AI to estimate how long a task will take based on type, title, and complexity.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskTitle: { type: 'STRING' },
        category: { type: 'STRING' },
        complexity: { type: 'STRING', enum: ['simple', 'medium', 'complex'] }
      },
      required: ['taskTitle']
    }
  },
  {
    name: 'send_notification',
    description: 'Send the user an in-app notification with a specific message and urgency level.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        body: { type: 'STRING' },
        urgency: { type: 'STRING', enum: ['low', 'medium', 'high', 'critical'] }
      },
      required: ['title', 'body', 'urgency']
    }
  },
  {
    name: 'generate_weekly_report',
    description: 'Generate a weekly productivity status report summarizing completed vs pending tasks and performance recommendations.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  }
];


