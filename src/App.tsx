import { FormEvent, useEffect, useRef, useState } from 'react';
import extensionLogo from './images/logo.png';
import arenaBg from './images/background.jpg';
import robotImage from './images/robot.png';
import ropeImage from './images/rope.png';
import Onboarding from './Onboarding';
import Settings from './Settings';
import AvatarEditor, { AvatarConfig, AvatarDisplay } from './AvatarEditor';
import Stats, { GameRecord } from './Stats';
import Leaderboard from './Leaderboard';
import music1 from './assets/coffee-time.wav';
import music2 from './assets/music2.wav';


type Difficulty = 'relaxed' | 'normal' | 'strict';
type MessageRole = 'user' | 'system';
type FeedbackTone = 'neutral' | 'good' | 'bad';
type ViewMode = 'game' | 'settings' | 'stats' | 'leaderboard' | 'avatar';
type ChatMessage = { role: MessageRole; text: string };
type RoundScore = {
  score: number;
  intentional: boolean;
  message: string;
  suggestion: string;
  flags?: {
    templateLeftOver: boolean;
    repeatPrompt: boolean;
    assignmentDump: boolean;
    shortcutSeeking: boolean;
  };
};

type CharacterFrame = 'default' | 'humansPull' | 'robotsPull';

type StoredPrefs = {
  onboardingComplete: boolean;
  alwaysOn: boolean;
  promptPermission: boolean;
  difficulty: Difficulty;
  music?: number;
  avatarConfig?: AvatarConfig;
};

const MAX_POINTS = 10;
const FEATURE_FLAG_VERSION_1_ALWAYS_ON = true;
const STORAGE_KEY = 'clanker_clash_prefs_v1';
const HISTORY_KEY = 'clanker_clash_history_v1';
const MAX_HISTORY = 20;
const MUSIC1_CUTOFF_SECONDS = 2 * 60 + 15; // 2:15

function readHistory(): GameRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(records: GameRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(-MAX_HISTORY)));
}

const difficultyConfig: Record<Difficulty, { minGoodScore: number; humanGain: number; robotGain: number }> = {
  relaxed: { minGoodScore: 4, humanGain: 2, robotGain: 1 },
  normal:  { minGoodScore: 6, humanGain: 2, robotGain: 2 },
  strict:  { minGoodScore: 8, humanGain: 2, robotGain: 3 },
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

function readStoredPrefs(): StoredPrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPrefs;
    if (
      typeof parsed.onboardingComplete !== 'boolean' ||
      typeof parsed.alwaysOn !== 'boolean' ||
      typeof parsed.promptPermission !== 'boolean' ||
      !['relaxed', 'normal', 'strict'].includes(parsed.difficulty) ||
      (parsed.music !== undefined && typeof parsed.music !== 'number')
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function scorePromptWithGemini(prompt: string, recentPrompts: string[]) {
  const response = await fetch('https://clanker-score-724869970530.us-central1.run.app/score-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      recentPrompts,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to score prompt');
  }

  return response.json() as Promise<RoundScore>;
}

function scorePrompt(prompt: string, level: Difficulty): RoundScore {
  const lowered = prompt.toLowerCase();
  let rawScore = 0;

  if (prompt.length > 35) rawScore += 2;
  if (prompt.length > 80) rawScore += 1;
  if (/[?]/.test(prompt)) rawScore += 1;
  if (/\b(explain|compare|why|how|step|hint|feedback|attempt|understand|learn|plan)\b/.test(lowered)) rawScore += 3;
  if (/\b(context|class|topic|goal|constraint|rubric|my work|i tried|example)\b/.test(lowered)) rawScore += 3;
  if (/\bjust|answer only|do it for me|copy|paste|homework answer|solve this\b/.test(lowered)) rawScore -= 3;
  if (/^\s*(answer|solve|do)\b/.test(lowered)) rawScore -= 2;
  if (prompt.split(' ').length < 6) rawScore -= 2;

  const intentional = rawScore >= difficultyConfig[level].minGoodScore;

  const score = intentional
    ? Math.max(1, Math.min(3, Math.floor(rawScore / 3)))
    : Math.min(-1, Math.max(-3, -Math.ceil((difficultyConfig[level].minGoodScore - rawScore) / 2)));

  return {
    score,
    intentional,
    message: intentional
      ? 'Intentional prompt. You gave context or learning intent, so humans gain ground.'
      : 'Low-effort prompt. It risks shortcut behavior, so robots gain ground.',
    suggestion: intentional
      ? 'Nice. Keep asking for hints, reasoning, or checks for understanding.'
      : 'Try adding your goal, what you already tried, and ask for guidance instead of a full answer.',
  };
}

function mapScoreToDifficulty(score: number, difficulty: Difficulty): number {
  const absScore = Math.abs(score);
  const cap = difficulty === 'relaxed' ? 1 : difficulty === 'normal' ? 2 : 3;
  const mapped = Math.min(absScore, cap);

  if (score > 0) return mapped;
  if (score < 0) return -mapped;
  return 0;
}

const PX_PER_POINT = 8;

type TugArenaProps = {
  avatarConfig: AvatarConfig;
  balance: number;
  characterFrame: CharacterFrame;
};

function TugArena({ avatarConfig, balance, characterFrame }: TugArenaProps) {
  const WINNER_DRIFT = PX_PER_POINT * 0.35;
  const LOSER_DRIFT = PX_PER_POINT * 1.2;

  let humanDrift = 0;
  let robotDrift = 0;

  if (balance > 0) {
    // robots winning
    humanDrift = balance * LOSER_DRIFT;
    robotDrift = balance * WINNER_DRIFT;
  } else if (balance < 0) {
    // humans winning
    humanDrift = balance * WINNER_DRIFT;
    robotDrift = balance * LOSER_DRIFT;
  }

  const ropeDrift = (humanDrift + robotDrift) / 2;

  const robotYanked = characterFrame === 'humansPull';
  const humanYanked = characterFrame === 'robotsPull';

  return (
    <div className="tug-track">
      <img src={arenaBg} className="tug-bg" alt="" aria-hidden />

      <img
        src={ropeImage}
        className="tug-sprite tug-rope"
        style={{ transform: `translate(${ropeDrift}px, -8px)` }}
        alt=""
        aria-hidden
      />

      <img
        src={robotImage}
        className={`tug-robot${robotYanked ? ' anim-yank-left' : ''}`}
        style={{ transform: `translateX(${robotDrift}px)` }}
        alt="Robot"
      />

    <div
      className={`tug-avatar${humanYanked ? ' anim-yank-right' : ''}`}
      style={{ transform: `translateX(calc(-50% + ${humanDrift}px))` }}
    >
      <AvatarDisplay config={avatarConfig} width={52} height={64} />
    </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const storedPrefs = readStoredPrefs();
  const allowAlwaysOn = FEATURE_FLAG_VERSION_1_ALWAYS_ON;

  const initialOnboardingComplete = storedPrefs?.onboardingComplete ?? false;
  const initialAlwaysOn = allowAlwaysOn ? (storedPrefs?.alwaysOn ?? true) : false;

  const [view, setView] = useState<ViewMode>('game');
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const [alwaysOn, setAlwaysOn] = useState(initialAlwaysOn);
  const [difficulty, setDifficulty] = useState<Difficulty>(storedPrefs?.difficulty ?? 'normal');
  const [music, setMusic] = useState(storedPrefs?.music ?? 30);
  const [promptPermission, setPromptPermission] = useState(storedPrefs?.promptPermission ?? false);
  const [onboardingComplete, setOnboardingComplete] = useState(initialOnboardingComplete);
  const [sessionActive, setSessionActive] = useState(initialAlwaysOn);
  const [sessionPromptDismissed, setSessionPromptDismissed] = useState(false);
  const [isExtensionOpen, setIsExtensionOpen] = useState(!initialOnboardingComplete || initialAlwaysOn);

  const [history, setHistory] = useState<GameRecord[]>(readHistory);
  const [roundIntentional, setRoundIntentional] = useState(0);
  const [roundLowEffort, setRoundLowEffort] = useState(0);

  const [humans, setHumans] = useState(0);
  const [robots, setRobots] = useState(0);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('neutral');
  const [feedbackText, setFeedbackText] = useState('Submit a prompt. Low-effort prompts help robots, thoughtful prompts help humans.');
  const [gameOver, setGameOver]         = useState(false);
  const [resultText, setResultText]     = useState('');
  const [characterFrame, setCharacterFrame] = useState<CharacterFrame>('default');
  const [showGamePlayCta, setShowGamePlayCta] = useState(initialOnboardingComplete);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(
    storedPrefs?.avatarConfig ?? { baseId: 'spiky', colorScheme: 'classic' },
  );
  const pullTimeoutRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasUserInteractedRef = useRef(false);
  const trackIndexRef = useRef(0);
  const musicLevelRef = useRef(30);

  const effectiveAlwaysOn = allowAlwaysOn && alwaysOn;
  const balance = robots - humans;

  const showSessionPrompt =
    onboardingComplete && !effectiveAlwaysOn && !sessionActive && !isExtensionOpen && !sessionPromptDismissed;

  const getAdjustedVolume = (trackSrc: string) => {
    const baseVolume = musicLevelRef.current / 100;
    const normalized = trackSrc === music2 ? baseVolume * 0.82 : baseVolume;
    return Math.max(0, Math.min(1, normalized));
  };

  useEffect(() => {
    return () => {
      if (pullTimeoutRef.current !== null) {
        window.clearTimeout(pullTimeoutRef.current);
      }
    };
  }, []);

  //music controls
  useEffect(() => {
    const playlist = [music1, music2];
    const audio = new Audio(playlist[0]);
    audio.loop = false;
    audio.volume = getAdjustedVolume(playlist[0]);
    audioRef.current = audio;
    trackIndexRef.current = 0;

    const switchToTrack = (index: number) => {
      trackIndexRef.current = index;
      const nextTrack = playlist[index];
      audio.src = nextTrack;
      audio.volume = getAdjustedVolume(nextTrack);
      if (hasUserInteractedRef.current) {
        audio.play().catch(() => {});
      }
    };

    const handleTrackEnded = () => {
      switchToTrack((trackIndexRef.current + 1) % playlist.length);
    };

    const handleTimeUpdate = () => {
      if (trackIndexRef.current === 0 && audio.currentTime >= MUSIC1_CUTOFF_SECONDS) {
        switchToTrack(1);
      }
    };

    audio.addEventListener('ended', handleTrackEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('ended', handleTrackEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    musicLevelRef.current = music;
    if (audioRef.current) {
      const currentTrack = trackIndexRef.current === 1 ? music2 : music1;
      audioRef.current.volume = getAdjustedVolume(currentTrack);
    }
  }, [music]);

  useEffect(() => {
    const unlockAudioOnFirstInteraction = () => {
      hasUserInteractedRef.current = true;
      if (isExtensionOpen && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockAudioOnFirstInteraction, { once: true });
    window.addEventListener('keydown', unlockAudioOnFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudioOnFirstInteraction);
      window.removeEventListener('keydown', unlockAudioOnFirstInteraction);
    };
  }, [isExtensionOpen]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isExtensionOpen && hasUserInteractedRef.current) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isExtensionOpen]);

  useEffect(() => {
    if (!onboardingComplete) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        onboardingComplete: true,
        alwaysOn: effectiveAlwaysOn,
        promptPermission,
        difficulty,
        music,
        avatarConfig,
      }),
    );
  }, [difficulty, effectiveAlwaysOn, onboardingComplete, promptPermission, music, avatarConfig]);

  function flashPullFrame(winner: 'humans' | 'robots') {
    if (pullTimeoutRef.current !== null) window.clearTimeout(pullTimeoutRef.current);
    setCharacterFrame(winner === 'humans' ? 'humansPull' : 'robotsPull');
    pullTimeoutRef.current = window.setTimeout(() => {
      setCharacterFrame('default');
      pullTimeoutRef.current = null;
    }, 600);
  }

  function addMessage(role: MessageRole, text: string) {
    setChat((prev) => [{ role, text }, ...prev]);
  }

  function endGame(nextHumans: number, nextRobots: number, intentional: number, lowEffort: number) {
    setGameOver(true);

    const record: GameRecord = {
      date: new Date().toISOString(),
      winner: nextHumans > nextRobots ? 'humans' : 'robots',
      humanScore: nextHumans,
      robotScore: nextRobots,
      difficulty,
      intentional,
      lowEffort,
    };
    setHistory((prev) => {
      const next = [...prev, record].slice(-MAX_HISTORY);
      saveHistory(next);
      return next;
    });

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
    setRoundIntentional(0);
    setRoundLowEffort(0);
    setGameOver(false);
    setResultText('');
    setFeedbackTone('neutral');
    setFeedbackText('New round started. Send a prompt to shift the balance.');
    setCharacterFrame('default');

    if (pullTimeoutRef.current !== null) {
      window.clearTimeout(pullTimeoutRef.current);
      pullTimeoutRef.current = null;
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (gameOver) return;
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;

    const recentPrompts = chat
      .filter((entry) => entry.role === 'user')
      .map((entry) => entry.text)
      .slice(0, 5);

    addMessage('user', nextPrompt);

    const extensionActive = onboardingComplete && isExtensionOpen && promptPermission && (effectiveAlwaysOn || sessionActive);
    if (!extensionActive) {
      addMessage('system', 'Extension is off for this session. Prompt sent without scoring.');
      setPrompt('');
      return;
    }

    let scoreData: RoundScore;

    try {
      scoreData = await scorePromptWithGemini(nextPrompt, recentPrompts);
    } catch {
      scoreData = scorePrompt(nextPrompt, difficulty);
    }
    let nextHumans = humans;
    let nextRobots = robots;
    let nextIntentional = roundIntentional;
    let nextLowEffort = roundLowEffort;

    const adjustedPoints = mapScoreToDifficulty(scoreData.score, difficulty);

    if (adjustedPoints > 0) {
      nextHumans = Math.min(MAX_POINTS, humans + adjustedPoints);
      nextIntentional = roundIntentional + 1;
      setHumans(nextHumans);
      setRoundIntentional(nextIntentional);
      setFeedbackTone('good');
      setFeedbackText(`${scoreData.message} ${scoreData.suggestion}`);
      flashPullFrame('humans');
    } else if (adjustedPoints < 0) {
      nextRobots = Math.min(MAX_POINTS, robots + Math.abs(adjustedPoints));
      nextLowEffort = roundLowEffort + 1;
      setRobots(nextRobots);
      setRoundLowEffort(nextLowEffort);
      setFeedbackTone('bad');
      setFeedbackText(`${scoreData.message} ${scoreData.suggestion}`);
      flashPullFrame('robots');
    } else {
      setFeedbackTone('neutral');
      setFeedbackText(`${scoreData.message} ${scoreData.suggestion}`);
    }

    const roundWinnerText =
      adjustedPoints > 0
        ? 'Humans gain points.'
        : adjustedPoints < 0
          ? 'Robots gain points.'
          : 'No points awarded.';
    addMessage('system', `${roundWinnerText} (${nextHumans}-${nextRobots})`);

    if (nextHumans >= MAX_POINTS || nextRobots >= MAX_POINTS) {
      endGame(nextHumans, nextRobots, nextIntentional, nextLowEffort);
    }

    setPrompt('');
  }

  function onCompleteOnboarding(result: { alwaysOn: boolean; difficulty: Difficulty; promptPermission: true }) {
    const nextAlwaysOn = allowAlwaysOn ? result.alwaysOn : false;

    setAlwaysOn(nextAlwaysOn);
    setDifficulty(result.difficulty);
    setPromptPermission(result.promptPermission);
    setOnboardingComplete(true);
    setSessionPromptDismissed(false);

    if (nextAlwaysOn) {
      setSessionActive(true);
      setIsExtensionOpen(true);
      setShowGamePlayCta(true);
    } else {
      setSessionActive(false);
      setIsExtensionOpen(false);
    }
  }

  function onAlwaysOnChange(checked: boolean) {
    setAlwaysOn(checked);
    if (checked) {
      setSessionActive(true);
      return;
    }
    setSessionPromptDismissed(false);
  }

  function onLogoClick() {
    setIsExtensionOpen((prev) => {
      const next = !prev;
      if (next && !effectiveAlwaysOn) {
        setSessionActive(true);
        setSessionPromptDismissed(true);
      }
      if (next && onboardingComplete) {
        setShowGamePlayCta(true);
      }
      if (next) {
        hasUserInteractedRef.current = true;
        audioRef.current?.play().catch(() => {});
      } else {
        audioRef.current?.pause();
      }
      return next;
    });
    setView('game');
  }

  const ropeCaption = balance === 0
      ? 'Tied match over the lava pit.'
      : balance > 0
        ? 'Robots are pulling ahead from low-effort prompting.'
        : 'Humans are pulling ahead with mindful prompts.';

  return (
    <div className="site-shell">
      <div className="browser-top">
        <header className="fake-browser-bar">
          <div className="browser-dots"><span /><span /><span /></div>
          <div className="url-pill">https://some-llm-site.local</div>
          <div className="ext-controls">
            <button
              className="ext-logo-btn"
              type="button"
              onClick={onLogoClick}
              aria-label="Toggle Clanker Clash extension"
              title="Toggle Clanker Clash"
            >
              <img className="ext-logo" src={extensionLogo} alt="Clanker Clash extension" />
            </button>
            <button className="ext-puzzle" type="button" aria-label="Extensions">
              🧩
            </button>
          </div>
        </header>

        {showSessionPrompt && (
          <div className="session-nudge">
            <p>We noticed you&apos;re on an LLM site. Turn on Clanker Clash for this session?</p>
            <div className="session-nudge-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  setSessionActive(true);
                  setIsExtensionOpen(true);
                  setSessionPromptDismissed(true);
                  if (onboardingComplete) {
                    setShowGamePlayCta(true);
                  }
                }}
              >
                Turn On
              </button>
              <button className="secondary-btn" onClick={() => setSessionPromptDismissed(true)}>
                Not now
              </button>
            </div>
          </div>
        )}

        {isExtensionOpen && (
          <aside className="extension">
            {!onboardingComplete ? (
              <Onboarding
                showAlwaysOnQuestion={allowAlwaysOn}
                initialDifficulty={difficulty}
                onComplete={onCompleteOnboarding}
              />
            ) : (
              <>
                <div className="extension-head">
                  <div>
                    <strong>Clanker Clash</strong>
                  </div>
                  <div className="extension-head-btns">
                    <div style={{ cursor: 'pointer' }} onClick={() => setView('settings')}>
                      <AvatarDisplay config={avatarConfig} width={26} height={32} />
                    </div>
                    <button
                      className={`icon-btn${view === 'leaderboard' ? ' icon-btn--active' : ''}`}
                      title="Leaderboard"
                      onClick={() => setView('leaderboard')}
                    >🏆</button>
                    <button
                      className={`icon-btn${view === 'stats' ? ' icon-btn--active' : ''}`}
                      title="Stats"
                      onClick={() => setView('stats')}
                    >📊</button>
                    <button
                      className={`icon-btn${view === 'settings' ? ' icon-btn--active' : ''}`}
                      title="Settings"
                      onClick={() => setView('settings')}
                    >⚙️</button>
                  </div>
                </div>

                <section className={`panel ${view === 'game' ? 'active' : ''}`}>
                  {showGamePlayCta && (
                    <div className="game-play-overlay">
                      <button className="play-btn game-play-btn" onClick={() => setShowGamePlayCta(false)}>
                        Play
                      </button>
                    </div>
                  )}
                  <div className="status-row">
                    <span className="badge humans">
                      Humans: <b>{humans}</b>
                    </span>
                    <span className="badge robots">
                      Robots: <b>{robots}</b>
                    </span>
                  </div>

                  <div className="arena" aria-label="Tug of war arena">
                    <TugArena avatarConfig={avatarConfig} balance={balance} characterFrame={characterFrame} />
                    <div className={`arena-caption ${feedbackTone}`}>{feedbackText || ropeCaption}</div>
                  </div>

                  <details className="rubric-details">
                    <summary className="rubric-summary">How scoring works</summary>
                    <div className="rubric-body">
                      <div className="rubric-col rubric-good">
                        <span className="rubric-col-title">+ Humans gain</span>
                        <ul>
                          <li>Add context, topic, or goal</li>
                          <li>Mention what you already tried</li>
                          <li>Ask why, how, or to compare</li>
                          <li>Request hints or feedback</li>
                          <li>Write 6+ words with a question</li>
                        </ul>
                      </div>
                      <div className="rubric-col rubric-bad">
                        <span className="rubric-col-title">+ Robots gain</span>
                        <ul>
                          <li>Very short or vague prompt</li>
                          <li>"Just give me the answer"</li>
                          <li>"Do it for me" / "solve this"</li>
                          <li>Starting with only "do" or "answer"</li>
                        </ul>
                      </div>
                    </div>
                  </details>

                  <label className="template-wrap">
                    Prompt templates
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setPrompt(e.target.value);
                      }}
                    >
                      <option value="">Select a template...</option>
                      {templates.map((t) => (
                        <option key={t.label} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>

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

                <Settings
                  isActive={view === 'settings'}
                  showAlwaysOn={allowAlwaysOn}
                  alwaysOn={alwaysOn}
                  difficulty={difficulty}
                  music={music}
                  avatarConfig={avatarConfig}
                  onAlwaysOnChange={onAlwaysOnChange}
                  onDifficultyChange={setDifficulty}
                  onMusicChange={setMusic}
                  onBack={() => setView('game')}
                  onEditAvatar={() => setView('avatar')}
                />

                <Stats
                  isActive={view === 'stats'}
                  history={history}
                  onBack={() => setView('game')}
                />

                <Leaderboard
                  isActive={view === 'leaderboard'}
                  currentAvatarConfig={avatarConfig}
                  onBack={() => setView('game')}
                />

                <AvatarEditor
                  isActive={view === 'avatar'}
                  currentConfig={avatarConfig}
                  onSave={setAvatarConfig}
                  onBack={() => setView('settings')}
                />
              </>
            )}
          </aside>
        )}
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
              onChange={(e) => setPrompt(e.target.value)}
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
