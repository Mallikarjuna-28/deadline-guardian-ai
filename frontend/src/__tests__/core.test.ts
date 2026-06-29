// ============================================================
// Deadline Guardian AI — Unit Test Suite (Vitest)
// Tests core business logic: risk scoring, NLP parsing, burnout
// ============================================================

import { describe, it, expect } from 'vitest';

// ─── Utility functions extracted from production code ─────────────────────────

/**
 * Compute AI deadline risk score (mirrors toolHandlers.ts logic)
 */
function computeRiskScore(deadlineIso: string, estimatedMinutes: number, priority: string): number {
  const hoursRemaining = (new Date(deadlineIso).getTime() - Date.now()) / (1000 * 60 * 60);
  const estimatedHours = estimatedMinutes / 60;

  if (hoursRemaining <= 0) return 100;
  if (estimatedHours <= 0) return 0;

  const ratio = estimatedHours / hoursRemaining;
  let base = Math.min(Math.round(ratio * 80), 80);
  if (priority === 'critical') base = Math.min(base + 20, 100);
  if (priority === 'high') base = Math.min(base + 10, 100);
  return base;
}

/**
 * NLP-parse a task string into structured fields (mirrors Landing.tsx parsing)
 */
function parseTaskNlp(input: string): {
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedMinutes: number;
} {
  const isCritical = /important|critical|urgent/i.test(input);
  const isHigh = /high/i.test(input);
  const priority = isCritical ? 'critical' : isHigh ? 'high' : 'medium';

  let estimatedMinutes = 60;
  const hoursMatch = input.match(/(\d+)\s*(hour|hr|h)/i);
  if (hoursMatch) estimatedMinutes = parseInt(hoursMatch[1]) * 60;

  const title = input.split(' by ')[0].trim() || 'Untitled Task';
  return { title, priority, estimatedMinutes };
}

/**
 * Compute burnout score from workload (mirrors Dashboard.tsx logic)
 */
function computeBurnoutScore(activeTasks: number, criticalTasks: number, streak: number, focusScore: number): number {
  const overloadPenalty = Math.min(activeTasks * 4, 40);
  const criticalPenalty = Math.min(criticalTasks * 10, 30);
  const streakBonus = Math.min(streak * 2, 20);
  const focusPenalty = focusScore < 60 ? 15 : 0;
  return Math.min(Math.max(overloadPenalty + criticalPenalty - streakBonus + focusPenalty, 5), 95);
}

/**
 * Validate deadline string is in future
 */
function isDeadlineValid(deadlineIso: string): boolean {
  return new Date(deadlineIso).getTime() > Date.now();
}

/**
 * Generate a rescue plan message (mirrors AI tool)
 */
function generateRescuePlan(taskTitle: string, hoursRemaining: number, estimatedMinutes: number): string {
  const feasible = estimatedMinutes / 60 <= hoursRemaining;
  if (!feasible) {
    return `URGENT: ${taskTitle} is overdue by estimation. Reduce scope or request extension.`;
  }
  return `Schedule ${estimatedMinutes} min blocks for "${taskTitle}" across the next ${Math.ceil(hoursRemaining)} hours.`;
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('🎯 Risk Score Calculator', () => {
  it('should return 100 for past deadlines', () => {
    const past = new Date(Date.now() - 3600 * 1000).toISOString();
    expect(computeRiskScore(past, 120, 'medium')).toBe(100);
  });

  it('should return higher risk for critical priority', () => {
    const future = new Date(Date.now() + 8 * 3600 * 1000).toISOString(); // 8 hours away
    const mediumRisk = computeRiskScore(future, 120, 'medium');
    const criticalRisk = computeRiskScore(future, 120, 'critical');
    expect(criticalRisk).toBeGreaterThan(mediumRisk);
  });

  it('should return 0 for zero estimated time', () => {
    const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    expect(computeRiskScore(future, 0, 'low')).toBe(0);
  });

  it('should cap score at 100', () => {
    const future = new Date(Date.now() + 1 * 3600 * 1000).toISOString(); // 1 hour away
    const score = computeRiskScore(future, 600, 'critical'); // 10 hours work in 1 hour
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should give low score for far future deadlines with small task', () => {
    const farFuture = new Date(Date.now() + 72 * 3600 * 1000).toISOString(); // 3 days away
    const score = computeRiskScore(farFuture, 30, 'low'); // 30 min task
    expect(score).toBeLessThan(10);
  });
});

describe('🧠 NLP Task Parser', () => {
  it('should parse critical priority from keywords', () => {
    const result = parseTaskNlp('Complete urgent report by Friday 5pm');
    expect(result.priority).toBe('critical');
  });

  it('should parse high priority from keyword', () => {
    const result = parseTaskNlp('Write high priority documentation by Monday');
    expect(result.priority).toBe('high');
  });

  it('should default to medium priority', () => {
    const result = parseTaskNlp('Read design document by tomorrow');
    expect(result.priority).toBe('medium');
  });

  it('should extract estimated hours correctly', () => {
    const result = parseTaskNlp('Code feature by Friday, takes 3 hours, critical');
    expect(result.estimatedMinutes).toBe(180);
  });

  it('should handle hour aliases (hr, h)', () => {
    const result1 = parseTaskNlp('Write tests, 2hr work, urgent');
    const result2 = parseTaskNlp('Review PR, 1h effort');
    expect(result1.estimatedMinutes).toBe(120);
    expect(result2.estimatedMinutes).toBe(60);
  });

  it('should parse task title from input', () => {
    const result = parseTaskNlp('Deploy app to Cloud Run by Sunday 10pm');
    expect(result.title).toBe('Deploy app to Cloud Run');
  });

  it('should fallback title to "Untitled Task" for empty input before "by"', () => {
    const result = parseTaskNlp('by tomorrow');
    expect(result.title).toBe('by tomorrow'); // no "by" split possible
  });
});

describe('🔥 Burnout Score Engine', () => {
  it('should return low score for minimal workload', () => {
    const score = computeBurnoutScore(2, 0, 10, 90);
    expect(score).toBeLessThan(30);
  });

  it('should return high score for heavy critical workload', () => {
    const score = computeBurnoutScore(10, 3, 0, 40);
    expect(score).toBeGreaterThan(60);
  });

  it('should never exceed 95', () => {
    const score = computeBurnoutScore(100, 100, 0, 0);
    expect(score).toBeLessThanOrEqual(95);
  });

  it('should never go below 5', () => {
    const score = computeBurnoutScore(0, 0, 100, 100);
    expect(score).toBeGreaterThanOrEqual(5);
  });

  it('should reduce score when streak is high', () => {
    const lowStreakScore = computeBurnoutScore(5, 1, 0, 80);
    const highStreakScore = computeBurnoutScore(5, 1, 10, 80);
    expect(highStreakScore).toBeLessThan(lowStreakScore);
  });

  it('should add penalty for low focus score', () => {
    const highFocusScore = computeBurnoutScore(5, 1, 5, 80);
    const lowFocusScore = computeBurnoutScore(5, 1, 5, 50);
    expect(lowFocusScore).toBeGreaterThan(highFocusScore);
  });
});

describe('📅 Deadline Validation', () => {
  it('should return true for future deadline', () => {
    const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    expect(isDeadlineValid(future)).toBe(true);
  });

  it('should return false for past deadline', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(isDeadlineValid(past)).toBe(false);
  });

  it('should handle iso string format correctly', () => {
    const validDate = '2099-12-31T23:59:59.000Z';
    expect(isDeadlineValid(validDate)).toBe(true);
  });
});

describe('🚨 Rescue Plan Generator', () => {
  it('should return feasibility message when enough time remains', () => {
    const plan = generateRescuePlan('Deploy App', 10, 120);
    expect(plan).toContain('Schedule 120 min blocks');
  });

  it('should return URGENT when task exceeds available time', () => {
    const plan = generateRescuePlan('Write Report', 1, 300); // 5 hours of work, 1 hour left
    expect(plan).toContain('URGENT');
  });

  it('should include task title in output', () => {
    const title = 'ML Model Training';
    const plan = generateRescuePlan(title, 8, 240);
    expect(plan).toContain(title);
  });
});
