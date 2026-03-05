import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import charactersDefaultImage from './images/characters_default.png';
import humansPullImage from './images/humans_pull.png';
import robotsPullImage from './images/robots_pull.png';
import extensionLogo from './images/logo.png';

type Difficulty = 'relaxed' | 'normal' | 'strict';
type MessageRole = 'user' | 'system';
type FeedbackTone = 'neutral' | 'good' | 'bad';
type ViewMode = 'game' | 'settings';

type ChatMessage = {
  role: MessageRole;
  text: string;
};

type RoundScore = {
  intentional: boolean;
  message: string;
  suggestion: string;
};
type CharacterFrame = 'default' | 'humansPull' | 'robotsPull';

const MAX_POINTS = 10;

const difficultyConfig: Record<Difficulty, { minGoodScore: number; humanGain: number; robotGain: number }> = {
  relaxed: { minGoodScore: 4, humanGain: 2, robotGain: 1 },
  normal: { minGoodScore: 6, humanGain: 2, robotGain: 2 },
  strict: { minGoodScore: 8, humanGain: 2, robotGain: 3 },
};

const templates = [
  {
    label: 'Learn + practice (with hint)',
    value:
      'I am studying [topic]. Explain the concept in simple terms, then give one practice question and a hint only.',
  },
  {
    label: 'Debug my attempt (stepwise)',
    value:
      'Help me debug my attempt. Here is my work: [paste work]. Point out one mistake at a time without giving the full answer.',
  },
  {
    label: 'Study plan builder',
    value:
      'Create a study plan for [topic] in 30 minutes. Include 3 goals, 2 checks for understanding, and one reflection question.',
  },
  {
    label: 'Compare approaches',
    value:
      'Compare two approaches to solve [problem type], then ask me which one I want to try and why before continuing.',
  },
];

function scorePrompt(prompt: string, level: Difficulty): RoundScore {
  const lowered = prompt.toLowerCase();
  let score = 0;

  if (prompt.length > 35) score += 2;
  if (prompt.length > 80) score += 1;
  if (/[?]/.test(prompt)) score += 1;
  if (/\b(explain|compare|why|how|step|hint|feedback|attempt|understand|learn|plan)\b/.test(lowered)) score += 3;
  if (/\b(context|class|topic|goal|constraint|rubric|my work|i tried|example)\b/.test(lowered)) score += 3;
  if (/\bjust|answer only|do it for me|copy|paste|homework answer|solve this\b/.test(lowered)) score -= 3;
  if (/^\s*(answer|solve|do)\b/.test(lowered)) score -= 2;
  if (prompt.split(' ').length < 6) score -= 2;

  const intentional = score >= difficultyConfig[level].minGoodScore;

  return {
    intentional,
    message: intentional
      ? 'Intentional prompt. You gave context or learning intent, so humans gain ground.'
      : 'Low-effort prompt. It risks shortcut behavior, so robots gain ground.',
    suggestion: intentional
      ? 'Nice. Keep asking for hints, reasoning, or checks for understanding.'
      : 'Try adding your goal, what you already tried, and ask for guidance instead of a full answer.',
  };
}

export default function App() {
  const [view, setView] = useState<ViewMode>('game');
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const [alwaysOn, setAlwaysOn] = useState(true);
  const [sessionOn, setSessionOn] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [music, setMusic] = useState(30);

  const [humans, setHumans] = useState(0);
  const [robots, setRobots] = useState(0);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('neutral');
  const [feedbackText, setFeedbackText] = useState(
    'Submit a prompt. Low-effort prompts help robots, thoughtful prompts help humans.',
  );
  const [showTemplates, setShowTemplates] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [resultText, setResultText] = useState('');
  const [characterFrame, setCharacterFrame] = useState<CharacterFrame>('default');
  const pullTimeoutRef = useRef<number | null>(null);

  const balance = robots - humans;
  const characterStyle = useMemo(
    () => ({ transform: `translate(-50%, 105px) translateX(${balance * 7}px)` }),
    [balance],
  );
  const characterImage =
    characterFrame === 'humansPull'
      ? humansPullImage
      : characterFrame === 'robotsPull'
        ? robotsPullImage
        : charactersDefaultImage;

  useEffect(() => {
    return () => {
      if (pullTimeoutRef.current !== null) {
        window.clearTimeout(pullTimeoutRef.current);
      }
    };
  }, []);

  function flashPullFrame(winner: 'humans' | 'robots') {
    if (pullTimeoutRef.current !== null) {
      window.clearTimeout(pullTimeoutRef.current);
    }

    setCharacterFrame(winner === 'humans' ? 'humansPull' : 'robotsPull');
    pullTimeoutRef.current = window.setTimeout(() => {
      setCharacterFrame('default');
      pullTimeoutRef.current = null;
    }, 1000);
  }

  function addMessage(role: MessageRole, text: string) {
    setChat((prev) => [{ role, text }, ...prev]);
  }

  function endGame(nextHumans: number, nextRobots: number) {
    setGameOver(true);

    if (nextHumans > nextRobots) {
      setResultText('Humans win. Reward unlocked: +25 coins and Mindful Starter badge.');
      addMessage('system', 'Session reflection: What prompt detail helped you learn the most?');
      return;
    }

    setResultText('Robots win. Reflection: Rewrite one prompt using a template and play again.');
    addMessage('system', 'Session reflection: What made your prompts low-effort this round?');
  }

  function resetGame() {
    setHumans(0);
    setRobots(0);
    setGameOver(false);
    setShowTemplates(false);
    setResultText('');
    setFeedbackTone('neutral');
    setFeedbackText('New round started. Send a prompt to shift the balance.');
    setCharacterFrame('default');
    if (pullTimeoutRef.current !== null) {
      window.clearTimeout(pullTimeoutRef.current);
      pullTimeoutRef.current = null;
    }
  }

  function onTemplateChange(value: string) {
    if (!value) return;
    setPrompt(value);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (gameOver) return;

    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;

    addMessage('user', nextPrompt);

    if (!alwaysOn || !sessionOn) {
      addMessage('system', 'Extension is off for this session. Prompt sent without scoring.');
      setPrompt('');
      return;
    }

    const scoreData = scorePrompt(nextPrompt, difficulty);
    const config = difficultyConfig[difficulty];

    let nextHumans = humans;
    let nextRobots = robots;

    if (scoreData.intentional) {
      nextHumans = Math.min(MAX_POINTS, humans + config.humanGain);
      setHumans(nextHumans);
      setFeedbackTone('good');
      setFeedbackText(`${scoreData.message} ${scoreData.suggestion}`);
      setShowTemplates(false);
      flashPullFrame('humans');
    } else {
      nextRobots = Math.min(MAX_POINTS, robots + config.robotGain);
      setRobots(nextRobots);
      setFeedbackTone('bad');
      setFeedbackText(`${scoreData.message} ${scoreData.suggestion}`);
      setShowTemplates(true);
      flashPullFrame('robots');
    }

    addMessage('system', `${scoreData.intentional ? 'Humans' : 'Robots'} gain points. (${nextHumans}-${nextRobots})`);

    if (nextHumans >= MAX_POINTS || nextRobots >= MAX_POINTS) {
      endGame(nextHumans, nextRobots);
    }

    setPrompt('');
  }

  const ropeCaption =
    balance === 0
      ? 'Tied match over the lava pit.'
      : balance > 0
        ? 'Humans are pulling ahead with mindful prompts.'
        : 'Robots are pulling ahead from low-effort prompting.';

  return (
    <div className="site-shell">
      <div className="browser-top">
        <header className="fake-browser-bar">
          <div className="browser-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="url-pill">https://some-llm-site.local</div>
          <div className="ext-controls">
            <img className="ext-logo" src={extensionLogo} alt="Clanker Clash extension" />
            <button className="ext-puzzle" type="button" aria-label="Extensions">
              🧩
            </button>
          </div>
        </header>

        <aside className="extension">
          <div className="extension-head">
            <div>
              <strong>Clanker Clash</strong>
              <p>Mindful prompting mini-game</p>
            </div>
            <button className="icon-btn" title="Settings" onClick={() => setView('settings')}>
              ⚙
            </button>
          </div>

          <section className={`panel ${view === 'game' ? 'active' : ''}`}>
            <div className="status-row">
              <span className="badge humans">
                Humans: <b>{humans}</b>
              </span>
              <span className="badge robots">
                Robots: <b>{robots}</b>
              </span>
            </div>

            <div className="arena" aria-label="Tug of war arena">
              <div className="arena-track">
                <div className="arena-pit">LAVA</div>
                <img
                  src={characterImage}
                  alt="Humans and robots tug-of-war"
                  className="character-strip"
                  style={characterStyle}
                />
              </div>
              <div className="arena-caption">{ropeCaption}</div>
            </div>

            <div className={`feedback ${feedbackTone}`}>{feedbackText}</div>

            {showTemplates && (
              <label className="template-wrap">
                Intentional prompt templates
                <select defaultValue="" onChange={(event) => onTemplateChange(event.target.value)}>
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.label} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {gameOver && (
              <div className="result">
                {resultText}
                <br />
                <button className="secondary-btn" style={{ marginTop: '0.6rem' }} onClick={resetGame}>
                  Play Again
                </button>
              </div>
            )}
          </section>

          <section className={`panel ${view === 'settings' ? 'active' : ''}`}>
            <h2>Game Settings</h2>
            <label className="toggle-row">
              <span>Always On</span>
              <input type="checkbox" checked={alwaysOn} onChange={(event) => setAlwaysOn(event.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>Enable this session</span>
              <input type="checkbox" checked={sessionOn} onChange={(event) => setSessionOn(event.target.checked)} />
            </label>

            <label className="field-row">
              Difficulty
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              >
                <option value="relaxed">Relaxed</option>
                <option value="normal">Normal</option>
                <option value="strict">Strict</option>
              </select>
            </label>

            <label className="field-row">
              Music
              <input
                type="range"
                min="0"
                max="100"
                value={music}
                onChange={(event) => setMusic(Number(event.target.value))}
              />
            </label>

            <button className="secondary-btn" onClick={() => setView('game')}>
              Back
            </button>
          </section>
        </aside>
      </div>

      <main className="llm-main">
        <div className="llm-brand">Some LLM Site</div>
        <div className="llm-center">
          <h1>Ask anything</h1>
          <form className="llm-form" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="Type your prompt here..."
              autoComplete="off"
              required
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <button type="submit">Send</button>
          </form>
          <div className="chat-log" aria-live="polite">
            {chat.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={`msg ${entry.role}`}>
                {entry.role === 'user' ? 'You' : 'Clanker Clash'}: {entry.text}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
