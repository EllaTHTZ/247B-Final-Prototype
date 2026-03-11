import { useState } from 'react';

type Difficulty = 'relaxed' | 'normal' | 'strict';
type OnboardingStep = 'landing' | 'howItWorks' | 'alwaysOn' | 'permission' | 'difficulty';

type OnboardingResult = {
  alwaysOn: boolean;
  difficulty: Difficulty;
  promptPermission: true;
};

type OnboardingProps = {
  showAlwaysOnQuestion: boolean;
  initialDifficulty: Difficulty;
  onComplete: (result: OnboardingResult) => void;
};

export default function Onboarding({
  showAlwaysOnQuestion,
  initialDifficulty,
  onComplete,
}: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>('landing');
  const [alwaysOn, setAlwaysOn] = useState(showAlwaysOnQuestion);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [permissionError, setPermissionError] = useState('');

  function startSetup() {
    setStep('howItWorks');
  }

  function afterHowItWorks() {
    setStep(showAlwaysOnQuestion ? 'alwaysOn' : 'permission');
  }

  function chooseAlwaysOn(value: boolean) {
    setAlwaysOn(value);
    setStep('permission');
  }

  function choosePermission(allowed: boolean) {
    if (!allowed) {
      setPermissionError('The game is only functional if we view your prompts.');
      return;
    }
    setPermissionError('');
    setStep('difficulty');
  }

  function finishOnboarding() {
    onComplete({
      alwaysOn,
      difficulty,
      promptPermission: true,
    });
  }

  if (step === 'landing') {
    return (
      <section className="onboarding">
        <h2>Clanker Clash</h2>
        <p className="onboarding-subtitle">Welcome, Human!</p>
        <p>Mindful LLM Prompting Game</p>
        <button className="play-btn" onClick={startSetup}>
          Play
        </button>
      </section>
    );
  }

  if (step === 'howItWorks') {
    return (
      <section className="onboarding">
        <h3>How It Works</h3>
        <ul className="how-it-works-list">
          <li>Humans and Robots are in a <b>tug-of-war over a lava pit</b>.</li>
          <li>You write prompts to an LLM as usual — Clanker Clash watches in the background.</li>
          <li><b>Thoughtful prompts</b> (with context, goals, or hints) earn points for <b>Humans</b>.</li>
          <li><b>Low-effort prompts</b> (vague, "do it for me") earn points for <b>Robots</b>.</li>
          <li>First side to <b>10 points</b> wins the round!</li>
        </ul>
        <button className="play-btn" onClick={afterHowItWorks}>
          Got it!
        </button>
      </section>
    );
  }

  if (step === 'alwaysOn') {
    return (
      <section className="onboarding">
        <h3>Do you want Clanker Clash always on when we detect an LLM site?</h3>
        <div className="onboarding-actions">
          <button className="secondary-btn" onClick={() => chooseAlwaysOn(true)}>
            Yes
          </button>
          <button className="secondary-btn" onClick={() => chooseAlwaysOn(false)}>
            No
          </button>
        </div>
      </section>
    );
  }

  if (step === 'permission') {
    return (
      <section className="onboarding">
        <h3>Do you give permission for Clanker Clash to view prompts while active?</h3>
        {permissionError && <p className="onboarding-error">{permissionError}</p>}
        <div className="onboarding-actions">
          <button className="secondary-btn" onClick={() => choosePermission(true)}>
            Yes
          </button>
          <button className="secondary-btn" onClick={() => choosePermission(false)}>
            No
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="onboarding">
      <h3>Which difficulty do you want?</h3>
      <p>You can change this anytime in settings.</p>
      <label className="field-row">
        Difficulty
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
          <option value="relaxed" title="More forgiving scoring and gentler penalties.">
            Relaxed
          </option>
          <option value="normal" title="Balanced scoring for everyday use.">
            Normal
          </option>
          <option value="strict" title="Higher standards and stronger penalties for low-effort prompts.">
            Strict
          </option>
        </select>
      </label>
      <button className="play-btn" onClick={finishOnboarding}>
        Finish Setup
      </button>
    </section>
  );
}
