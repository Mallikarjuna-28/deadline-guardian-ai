// Keyword-based sentiment detection for AI agent emotional intelligence

const STRESS_KEYWORDS = [
  'stressed', 'overwhelmed', "can't do this", 'too much', 'anxious',
  'panicking', 'drowning', 'stuck', 'behind', 'failing', 'struggling',
  "can't cope", 'exhausted', 'burned out', 'freaking out', 'worried',
  "don't know how", 'impossible', 'overloaded', 'swamped'
];

const ENERGY_KEYWORDS = [
  "let's go", 'crushing it', 'feeling great', 'ready', 'motivated',
  'pumped', 'fired up', 'on fire', "let's do this", 'excited',
  'focused', 'in the zone', 'unstoppable', 'energized', 'hyped',
  "let's crush", 'confident', 'killing it'
];

export type Sentiment = 'stressed' | 'energized' | 'normal';

export function detectSentiment(message: string): Sentiment {
  const lower = message.toLowerCase();
  if (STRESS_KEYWORDS.some(w => lower.includes(w))) return 'stressed';
  if (ENERGY_KEYWORDS.some(w => lower.includes(w))) return 'energized';
  return 'normal';
}

export function getSentimentPromptAddition(sentiment: Sentiment): string {
  if (sentiment === 'stressed') {
    return `

IMPORTANT — USER SENTIMENT DETECTED: The user appears stressed or overwhelmed.
Adapt your response style:
- Use a gentle, empathetic and supportive tone
- Start with a brief acknowledgement like "I can see you're under pressure —"
- Break tasks into very small, manageable steps (max 2-3 at a time)
- Prioritize reducing cognitive load above everything else
- Keep response concise and reassuring
- Focus on the single most important action first`;
  }

  if (sentiment === 'energized') {
    return `

IMPORTANT — USER SENTIMENT DETECTED: The user is motivated and energized.
Adapt your response style:
- Match their energy with direct, ambitious language
- Start with "Love the energy —" or "Let's capitalize on this momentum —"
- Suggest stretch goals and maximize productivity
- Be concise, action-oriented and push for more
- Challenge them positively`;
  }

  return '';
}
