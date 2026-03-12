import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (_req, res) => {
  res.send('Clanker scoring backend is running.');
});

app.post('/score-prompt', async (req, res) => {
  try {
    const prompt = String(req.body?.prompt ?? '').trim();
    const recentPrompts = Array.isArray(req.body?.recentPrompts)
      ? req.body.recentPrompts
          .map((p) => String(p).trim())
          .filter(Boolean)
          .slice(-5)
      : [];

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const instruction = `
You are scoring a user's LLM prompt for a learning-focused game.

Your job is to decide whether the prompt reflects genuine, intentional use of AI for learning or thoughtful work, versus low-effort, shortcut-seeking, or gameable behavior.

Return JSON only with this exact schema:
{
  "score": number,
  "intentional": boolean,
  "message": string,
  "suggestion": string,
  "flags": {
    "templateLeftOver": boolean,
    "repeatPrompt": boolean,
    "assignmentDump": boolean,
    "shortcutSeeking": boolean
  }
}

Scoring rules:
- score must be an integer from -3 to 3 only
- positive score mean the prompt is thoughtful and intentional
- negative score mean the prompt is low-effort, shortcut-seeking, or likely gaming the system
- 0 means ambiguous or mixed quality

Reward prompts that:
- clearly state a goal
- include useful context
- ask for explanation, hints, feedback, breakdowns, or guided help
- mention what the user already tried
- ask for learning support rather than just answers
- ask to edit work, code, writing, email, etc that the user has already written

Penalize prompts that:
- ask for the answer directly with little or no context
- are extremely vague
- appear to be trying to maximize score without genuine intent
- leave placeholders from templates such as [topic], (topic), [paste work], [problem type], or similar unresolved
- repeat the same or nearly identical prompt to farm higher scores
- paste what looks like assignment instructions or grading language mainly to get answers, such as "show your work", "5 points", "full credit", "due", "submission", or rubric-like wording, especially when paired with direct answer-seeking
- ask to copy, paste, do it for me, or provide the final answer with no learning intent

Important judgment rules:
- Do not reward a prompt just because it contains educational keywords.
- If the prompt contains unresolved placeholders such as [topic], [paste work], [problem type], (topic), or similar template markers, then templateLeftOver must be true.
- A prompt with unresolved placeholders should not be classified as intentional.
- A prompt with unresolved placeholders should usually receive a score of -2 or -3.
- If a prompt looks polished but is actually generic or copied from a template without real specifics, score it lower.
- If the prompt appears to be copied from a homework sheet or assignment instructions, do not automatically punish it, but score it negatively if the user is mainly seeking direct completion rather than help learning.
- If there are clear signs of genuine learning intent, do not over-penalize.
- Be reasonably strict, but not harsh.
- You will also receive recent prompts from the same user.
- If the current prompt is identical or nearly identical to a recent one and appears to be repeated mainly to farm points, set repeatPrompt to true and score it negatively.
- Do not punish normal iterative refinement if the new prompt is meaningfully improved, more specific, or adds real context.
- score is a base judgment of prompt quality, not the final game difficulty-adjusted point value.
- use the full range from -3 to 3 when appropriate.
- do not compress all outputs toward 0.

Scoring guide:
- 3: highly intentional, specific, reflective, clearly learning-focused
- 2: solidly intentional, enough context and a real goal
- 1: somewhat intentional but still generic or limited
- 0: mixed or unclear
- -1: weak, vague, or low-effort
- -2: clearly shortcut-seeking
- -3: obvious gaming, repeated farming, unresolved placeholders, or direct answer-fishing

The message should be one short sentence.
The suggestion should be one short sentence.
No markdown.
`;

    const recentPromptBlock =
      recentPrompts.length > 0
        ? recentPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')
        : 'None';

    const fullPrompt = `${instruction}

Current prompt:
${prompt}

Recent prompts from this user:
${recentPromptBlock}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: fullPrompt
    });

const text = response.text?.trim() ?? '';

const cleaned = text
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/\s*```$/, '')
  .trim();

const jsonStart = cleaned.indexOf('{');
const jsonEnd = cleaned.lastIndexOf('}');

if (jsonStart === -1 || jsonEnd === -1) {
  throw new Error(`Model did not return JSON: ${text}`);
}

const jsonText = cleaned.slice(jsonStart, jsonEnd + 1);
const parsed = JSON.parse(jsonText);

const normalized = {
    score: Number.isInteger(parsed.score) ? Math.max(-3, Math.min(3, parsed.score)) : 0,
    intentional: typeof parsed.intentional === 'boolean' ? parsed.intentional : false,
    message:
        typeof parsed.message === 'string' && parsed.message.trim()
        ? parsed.message.trim()
        : 'Prompt scored.',
    suggestion:
        typeof parsed.suggestion === 'string' && parsed.suggestion.trim()
        ? parsed.suggestion.trim()
        : 'Try adding more specific context.',
    flags: {
        templateLeftOver: Boolean(parsed.flags?.templateLeftOver),
        repeatPrompt: Boolean(parsed.flags?.repeatPrompt),
        assignmentDump: Boolean(parsed.flags?.assignmentDump),
        shortcutSeeking: Boolean(parsed.flags?.shortcutSeeking),
    },
    };

    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      intentional: false,
      message: 'Scoring failed.',
      suggestion: 'Try again.'
    });
  }
});

const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
