import { GoogleGenerativeAI } from '@google/generative-ai';
import { dbService } from '../../repositories/db';
import { agentToolDeclarations } from './agentTools';
import { toolHandlers } from './toolHandlers';


const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini AI SDK successfully initialized');
  } catch (error) {
    console.error('Failed to initialize Gemini AI SDK:', error);
  }
} else {
  console.log('GEMINI_API_KEY not found. Running Gemini Service in Mock Mode.');
}

// Helper to check if live Gemini is enabled
export const isLiveAI = () => genAI !== null;

export const geminiService = {
  /**
   * 1. Natural Language Task Parser
   * Parses natural text like: "Review speech notes on Monday 2pm, very important, takes 2h"
   */
  parseTaskFromNaturalLanguage: async (prompt: string): Promise<any> => {
    const systemPrompt = `
      You are an expert NLP parser. Extract task information from the user prompt and format it as JSON.
      Today's date and time is ${new Date().toISOString()}.
      
      Output MUST strictly match this JSON schema:
      {
        "title": "string (the task action title)",
        "deadline": "ISO 8601 string (compute based on text, e.g. next Monday -> next Monday at 23:59:00)",
        "priority": "critical" | "high" | "medium" | "low",
        "estimatedMinutes": number (estimated duration in minutes, default to 60 if not specified),
        "tags": ["string"],
        "category": "string (one of: Work, Study, Health, Personal, DevOps, Admin)",
        "aiConfidence": number (0.0 to 1.0)
      }
      Do not include any markdown formatting like \`\`\`json in the output. Just return raw JSON.
    `;

    if (!isLiveAI()) {
      // Mock Natural Language Parsing
      console.log('[Mock AI] Parsing NLP text:', prompt);
      const isCritical = /important|critical|urgent/i.test(prompt);
      const isHigh = /high/i.test(prompt);
      const priority = isCritical ? 'critical' : (isHigh ? 'high' : 'medium');
      
      let estMin = 60;
      const hoursMatch = prompt.match(/(\d+)\s*(hour|hr|h)/i);
      if (hoursMatch) estMin = parseInt(hoursMatch[1]) * 60;
      
      const deadline = new Date(Date.now() + 3600 * 1000 * 24 * 3).toISOString(); // Due in 3 days

      return {
        title: prompt.split('by')[0].trim().substring(0, 50) || 'New AI Task',
        deadline,
        priority,
        estimatedMinutes: estMin,
        tags: ['nlp-generated', 'quick-add'],
        category: 'Work',
        aiConfidence: 0.92
      };
    }

    try {
      const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\nUser input: "${prompt}"` }] }
        ]
      });
      const text = response.response.text().trim();
      return JSON.parse(text);
    } catch (e) {
      console.error('Gemini NLP parse failed, using local heuristic:', e);
      return {
        title: prompt,
        deadline: new Date(Date.now() + 3600 * 1000 * 48).toISOString(),
        priority: 'medium',
        estimatedMinutes: 60,
        tags: ['nlp-error-fallback'],
        category: 'Work',
        aiConfidence: 0.5
      };
    }
  },

  /**
   * 2. AI Morning Brief Generator
   * Generates a warm, structured brief of tasks, deadlines, streaks and energy levels.
   */
  generateMorningBrief: async (userId: string): Promise<string> => {
    const user = await dbService.getUser(userId);
    const tasks = await dbService.getTasks(userId);
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline).getTime() < Date.now()));

    const contextStr = `
      User details: ${JSON.stringify(user)}
      Incomplete Tasks: ${JSON.stringify(pendingTasks)}
      Overdue Tasks: ${JSON.stringify(overdueTasks)}
    `;

    const prompt = `
      You are the Deadline Guardian AI agent. Write a personalized morning brief.
      Write exactly 3 short paragraphs:
      Paragraph 1: A warm, personalized greeting mentioning their name and productivity level, summarizing their main focus today.
      Paragraph 2: An alert detailing what is at risk or overdue and must be prioritized first. Be specific about task names and deadlines.
      Paragraph 3: An encouraging motivational boost or advice matching their energy preferences (e.g. morning person vs night owl).
      
      Keep it actionable, highly relevant, and professional.
    `;

    if (!isLiveAI()) {
      console.log('[Mock AI] Generating Morning Brief for', userId);
      const name = user?.displayName || 'Productive User';
      const streak = user?.streak || 3;
      return `Good morning, ${name}! Your current productivity score is at a solid 84%, and you are on a **${streak}-day streak**. Today is all about maintaining that momentum.

You have one critical task at immediate risk: **Finish ML Hackathon presentation deck** is due in less than 4 hours and has a high calculated risk score. I recommend tackling this first.

As a morning person, your peak focus hours start now. I've cleared your calendar between 9:00 AM and 11:00 AM to give you a distraction-free window for deep work. Let's conquer the day!`;
    }

    try {
      const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${prompt}\nContext details:\n${contextStr}` }] }
        ]
      });
      return response.response.text();
    } catch (e) {
      return `Good morning! You have ${pendingTasks.length} pending tasks to finish. Take action and make progress today. You got this!`;
    }
  },

  /**
   * 3. Deadline Risk Scoring
   * Calculates 0-100 risk score and provides reasons.
   */
  computeDeadlineRisk: async (userId: string, taskId: string): Promise<any> => {
    const tasks = await dbService.getTasks(userId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return { riskScore: 10, riskLevel: 'LOW', reasoning: 'Task not found' };

    const prompt = `
      Perform a risk assessment on this task:
      Task: ${JSON.stringify(task)}
      Current Time: ${new Date().toISOString()}
      
      Provide your output strictly in JSON:
      {
        "riskScore": number (0 to 100),
        "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "reasoning": "Explain why this score was assigned. Consider estimate vs actual and deadline buffer.",
        "recommendation": "Actionable feedback to reduce risk."
      }
      Do not wrap in markdown \`\`\`json blocks. Return raw JSON.
    `;

    if (!isLiveAI()) {
      const deadlineTime = new Date(task.deadline).getTime();
      const timeLeftMs = deadlineTime - Date.now();
      const estMs = (task.estimatedMinutes || 60) * 60 * 1000;
      
      let riskScore = 15;
      let riskLevel = 'LOW';
      
      if (timeLeftMs < 0) {
        riskScore = 95;
        riskLevel = 'CRITICAL';
      } else if (timeLeftMs < estMs) {
        riskScore = 85;
        riskLevel = 'HIGH';
      } else if (timeLeftMs < estMs * 3) {
        riskScore = 55;
        riskLevel = 'MEDIUM';
      }

      const reasoning = riskScore > 50 
        ? `Task duration estimate is ${task.estimatedMinutes} mins but only ${Math.round(timeLeftMs / 60000)} minutes left until deadline.`
        : 'Sufficient time buffer remains.';

      return {
        riskScore,
        riskLevel,
        reasoning,
        recommendation: riskScore > 50 ? 'Reschedule low priority tasks or block immediate deep work time.' : 'Execute according to normal schedule.'
      };
    }

    try {
      const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      return JSON.parse(response.response.text().trim());
    } catch (e) {
      return {
        riskScore: 30,
        riskLevel: 'LOW',
        reasoning: 'AI estimation failed, falling back to default heuristic.',
        recommendation: 'Keep working on tasks on schedule.'
      };
    }
  },

  /**
   * 4. Daily Plan Scheduler
   * Slots tasks into time blocks.
   */
  generateDailyPlan: async (userId: string): Promise<any> => {
    const user = await dbService.getUser(userId);
    const tasks = await dbService.getTasks(userId);
    const pendingTasks = tasks.filter(t => t.status !== 'completed');

    const prompt = `
      Create a structured daily schedule based on these user settings:
      User: ${JSON.stringify(user)}
      Incomplete Tasks: ${JSON.stringify(pendingTasks)}
      
      You must fit tasks within the user's preferred work hours. Output strictly in JSON format:
      {
        "schedule": [
          { "taskId": "string", "startTime": "HH:MM", "endTime": "HH:MM", "reason": "string" }
        ],
        "insights": "string (overall summary text)",
        "warnings": ["string (e.g. task X will not fit, reschedule requested)"]
      }
      Do not include markdown tags. Return raw JSON.
    `;

    if (!isLiveAI()) {
      const schedule = pendingTasks.map((t, idx) => {
        const startHour = 9 + idx;
        return {
          taskId: t.id,
          startTime: `${String(startHour).padStart(2, '0')}:00`,
          endTime: `${String(startHour + 1).padStart(2, '0')}:00`,
          reason: t.priority === 'critical' ? 'High priority, handles immediately during peak hours.' : 'Scheduled next sequentially.'
        };
      });

      return {
        schedule,
        insights: "I've slotted your highest priority task first thing in the morning when focus energy is maximum.",
        warnings: []
      };
    }

    try {
      const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      return JSON.parse(response.response.text().trim());
    } catch (e) {
      return { schedule: [], insights: 'Failed to optimize schedule.', warnings: [] };
    }
  },

  /**
   * 5. AI Subtask Generator
   */
  generateSubtasks: async (taskTitle: string, context?: string): Promise<string[]> => {
    const prompt = `
      Break down the task "${taskTitle}" into 3 to 6 concrete, actionable steps or subtasks.
      Additional context: ${context || 'None'}
      
      Output strictly in JSON:
      {
        "subtasks": ["string"]
      }
      Do not include markdown tags. Return raw JSON.
    `;

    if (!isLiveAI()) {
      return [
        'Analyze parameters and project files',
        'Outline structural core logic',
        'Draft final code review implementation',
        'Perform unit tests and verification steps'
      ];
    }

    try {
      const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const data = JSON.parse(response.response.text().trim());
      return data.subtasks || [];
    } catch (e) {
      return ['Execute task requirements', 'Verify final output'];
    }
  },

  /**
   * 6. Streaming Agent Chat with Function Calling
   * Emits updates to an Express SSE response.
   */
  chatSSE: async (
    userId: string,
    message: string,
    history: { role: string; parts: string }[],
    sendEvent: (event: string, data: any) => void
  ): Promise<void> => {
    sendEvent('status', { message: 'Thinking...' });

    // Local Fallback simulation function
    const runLocalAgentFallback = async (fallbackReason?: string) => {
      if (fallbackReason) {
        sendEvent('status', { message: '⚠️ Gemini API connection offline. Switching to local guardian flow...' });
        console.warn(`[Agent Fallback] Triggered due to: ${fallbackReason}`);
        await new Promise(r => setTimeout(r, 800));
      }

      const lower = message.toLowerCase();
      let triggeredTool = '';
      let toolArgs: any = {};

      // Match against the 15 standard demo phrases
      if (lower.includes('overdue')) {
        triggeredTool = 'get_overdue_tasks';
      } else if (lower.includes('conflict') || lower.includes('scheduling conflict')) {
        triggeredTool = 'detect_conflicts';
      } else if (lower.includes('daily plan')) {
        triggeredTool = 'generate_daily_plan';
      } else if (lower.includes('weekly plan')) {
        triggeredTool = 'generate_weekly_plan';
      } else if (lower.includes('reschedule my lowest') || lower.includes('reschedule lowest')) {
        triggeredTool = 'reschedule_task';
        toolArgs = { priority: 'low', newDeadline: new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString(), reason: 'AI Optimization' };
      } else if (lower.includes('bulk reschedule') || lower.includes('bulk')) {
        triggeredTool = 'bulk_reschedule';
        toolArgs = { reschedules: [{ taskId: 'task-2', newDeadline: new Date(Date.now() + 3600 * 1000 * 24 * 5).toISOString() }] };
      } else if (lower.includes('compute risk') || lower.includes('risk score') || lower.includes('compute risk scores')) {
        triggeredTool = 'compute_all_risks';
      } else if (lower.includes('rescue plan')) {
        triggeredTool = 'generate_rescue_plan';
        toolArgs = { overdueTaskIds: ['task-1'] };
      } else if (lower.includes('subtasks') || lower.includes('break down')) {
        triggeredTool = 'generate_subtasks';
        toolArgs = { taskId: 'task-1', title: 'Finish ML Hackathon presentation deck' };
      } else if (lower.includes('time travel') || lower.includes('scenarios')) {
        triggeredTool = 'generate_time_travel';
        toolArgs = { horizonDays: 7 };
      } else if (lower.includes('estimate') || lower.includes('how long')) {
        triggeredTool = 'estimate_duration';
        toolArgs = { taskTitle: 'Finish ML Hackathon presentation deck', complexity: 'complex', category: 'Work' };
      } else if (lower.includes('notification')) {
        triggeredTool = 'send_notification';
        toolArgs = { title: 'Critical Deadline Risk', body: 'Finish ML Hackathon presentation deck is due soon!', urgency: 'critical' };
      } else if (lower.includes('google calendar') || lower.includes('add my most')) {
        triggeredTool = 'add_to_google_calendar';
        toolArgs = { taskId: 'task-1' };
      } else if (lower.includes('test project') || lower.includes('create a new project')) {
        triggeredTool = 'create_project';
        toolArgs = { name: 'Test Project', deadline: new Date(Date.now() + 3600 * 1000 * 24 * 30).toISOString(), description: 'Demo project' };
      } else if (lower.includes('complete my oldest') || lower.includes('complete oldest') || lower.includes('complete my oldest task')) {
        triggeredTool = 'complete_task';
      } else if (lower.includes('create task') || lower.includes('need to prepare')) {
        triggeredTool = 'create_task';
        toolArgs = { title: 'Prepare for Google Interview', priority: 'high', deadline: new Date(Date.now() + 3600 * 1000 * 24).toISOString() };
      } else if (lower.includes('weekly report') || lower.includes('productivity report')) {
        triggeredTool = 'generate_weekly_report';
      }


      if (triggeredTool) {
        sendEvent('tool', { tool: triggeredTool, params: toolArgs });
        try {
          const result = await toolHandlers[triggeredTool](toolArgs, userId, sendEvent as any);
          sendEvent('content', result.message || `Successfully executed tool ${triggeredTool}.`);
        } catch (e: any) {
          sendEvent('content', `Attempted to run "${triggeredTool}" locally but failed: ${e.message}`);
        }
        sendEvent('done', {});
        return;
      }

      // Default mock agent conversation if no tool matches
      const phrases = [
        'Hello! I am your Deadline Guardian AI. ',
        'I am currently operating in resilient local mode. ',
        'You are doing great with a **5-day streak**. ',
        'Type any command like "What tasks are overdue?", "Detect conflicts", or "Generate daily plan" to try my autonomous tools locally!'
      ];
      for (const phrase of phrases) {
        sendEvent('content', phrase);
        await new Promise(r => setTimeout(r, 120));
      }
      sendEvent('done', {});
    };

    if (!isLiveAI()) {
      await runLocalAgentFallback();
      return;
    }

    try {
      // Connect to Gemini live model with function calling declaration
      const model = genAI!.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: [{ functionDeclarations: agentToolDeclarations } as any]
      });

      // Prepare Chat sessions
      let formattedHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : h.role,
        parts: [{ text: h.parts }]
      }));

      // Gemini history must start with a 'user' message
      while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
      }

      const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
          maxOutputTokens: 2048,
        }
      });

      const responseStream = await chat.sendMessageStream(message);

      let textContent = '';
      for await (const chunk of responseStream.stream) {
        const text = chunk.text();
        if (text) {
          textContent += text;
          sendEvent('content', text);
        }

        // Check if function calls are present
        const calls = chunk.functionCalls();
        if (calls && calls.length > 0) {
          for (const call of calls) {
            sendEvent('tool', { tool: call.name, params: call.args });
            console.log('[Gemini Agent Tool Fired]', call.name, call.args);

            // Execute specific local side effects based on tool triggers
            const result = await executeAgentTool(userId, call.name, call.args, sendEvent);
            
            // Send feedback back to the Gemini agent session context
            const responseStreamNext = await chat.sendMessageStream([{
              functionResponse: {
                name: call.name,
                response: { result }
              }
            } as any]);

            for await (const chunkNext of responseStreamNext.stream) {
              const textNext = chunkNext.text();
              if (textNext) {
                textContent += textNext;
                sendEvent('content', textNext);
              }
            }
          }
        }
      }
      sendEvent('done', {});
    } catch (error: any) {
      console.error('Gemini Stream error, falling back to local flow:', error);
      await runLocalAgentFallback(error.message);
    }
  },

  /**
   * Gemini Vision â€” scan image and extract tasks
   */
  scanImageForTasks: async (imageBase64: string, mimeType: string): Promise<any> => {
    return scanImageForTasksMethod(imageBase64, mimeType);
  },

  /**
   * Deadline Time Travel â€” 3-scenario simulation
   */
  generateTimeTravelScenarios: async (tasks: any[], horizonDays: number): Promise<any> => {
    return generateTimeTravelScenariosMethod(tasks, horizonDays);
  }
};

// Central tool executor â€” delegates to toolHandlers registry
async function executeAgentTool(userId: string, name: string, args: any, sendEvent: Function): Promise<any> {
  sendEvent('status', { message: `ðŸ”§ Running: ${name}...` });

  try {
    // Check toolHandlers registry first (covers all 20 tools)
    const handler = toolHandlers[name];
    if (handler) {
      const result = await handler(args, userId, sendEvent as any);
      sendEvent('status', { message: `âœ… ${name} completed.` });
      return result;
    }

    // Fallback for any unlisted tool name
    console.warn(`[Agent] Unknown tool called: ${name}`, args);
    return { error: `Tool "${name}" is not registered.`, args };
  } catch (error: any) {
    console.error(`[Agent Tool Error] ${name}:`, error);
    sendEvent('status', { message: `âš ï¸ ${name} encountered an error.` });
    return { error: error.message || 'Tool execution failed', tool: name };
  }
}

// --- New Gemini Vision + Time Travel methods ---




export async function scanImageForTasksMethod(imageBase64: string, mimeType: string): Promise<any> {
  if (!isLiveAI()) {
    return {
      tasks: [
        { title: 'Submit project report', deadline: null, priority: 'high', notes: 'Scanned from image' },
        { title: 'Review client proposal', deadline: null, priority: 'medium', notes: 'Scanned from image' },
        { title: 'Team standup notes', deadline: null, priority: 'low', notes: 'Scanned from image' },
      ],
      count: 3,
      fallback: true
    };
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType as any,
          data: imageBase64
        }
      },
      {
        text: `You are a task extraction AI. Look carefully at this image.
Extract EVERY task, to-do item, reminder, or action item visible.
This could be a handwritten list, sticky note, whiteboard, or printed document.

Return ONLY a valid JSON array. No explanation. No markdown. No code fences.
[
  {
    "title": "exact task name as written",
    "deadline": "ISO 8601 datetime string if a date is visible, otherwise null",
    "priority": "critical or high or medium or low based on urgency words",
    "notes": "any extra context visible near the task, or empty string"
  }
]
Extract every single item you can see. Be thorough.`
      }
    ]);

    const text = result.response.text().replace(/\`\`\`json|\`\`\`/g, '').trim();
    const tasks = JSON.parse(text);
    return { tasks, count: tasks.length };
  } catch (error) {
    console.error('Vision scan failed:', error);
    return {
      tasks: [{ title: 'Task extracted from image', deadline: null, priority: 'medium', notes: '' }],
      count: 1,
      fallback: true
    };
  }
}

export async function generateTimeTravelScenariosMethod(tasks: any[], horizonDays: number): Promise<any> {
  const active = tasks.filter((t: any) => t.status !== 'completed');

  if (!isLiveAI() || active.length === 0) {
    return {
      scenarios: [
        { id: 'A', completed: Math.floor(active.length * 0.5), missed: Math.ceil(active.length * 0.5), description: `At current pace, you miss ${Math.ceil(active.length * 0.5)} of ${active.length} deadlines. Continuing without change will hurt your productivity score.` },
        { id: 'B', completed: Math.floor(active.length * 0.9), missed: Math.ceil(active.length * 0.1), description: `With AI optimization, you complete ${Math.floor(active.length * 0.9)} of ${active.length} tasks on time. I'll reschedule low-priority items and protect critical deadlines.` },
        { id: 'C', completed: active.length, missed: 0, description: `Maximum focus mode clears everything. Requires 8+ hour deep work blocks. Only sustainable for 1â€“2 days before burnout risk rises.` }
      ]
    };
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a deadline prediction AI. Analyze these ${active.length} active tasks and simulate 3 realistic scenarios for the next ${horizonDays} days from ${new Date().toISOString()}.

Tasks: ${JSON.stringify(active.map((t: any) => ({
  title: t.title, deadline: t.deadline,
  priority: t.priority, estimatedMinutes: t.estimatedMinutes || 60
})))}

Return ONLY valid JSON, no markdown:
{
  "scenarios": [
    {"id": "A", "completed": number, "missed": number, "description": "2 specific sentences about current pace"},
    {"id": "B", "completed": number, "missed": number, "description": "2 specific sentences about AI-optimized outcome"},
    {"id": "C", "completed": number, "missed": number, "description": "2 specific sentences about maximum effort, note it is unsustainable"}
  ]
}
Scenario A must be worse than B. Scenario C must have 0 missed. Be realistic.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/\`\`\`json|\`\`\`/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('Time travel generation failed:', err);
    throw err;
  }
}
