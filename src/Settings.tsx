import { useState } from 'react';

type Difficulty = 'relaxed' | 'normal' | 'strict';

type SettingsProps = {
  isActive: boolean;
  showAlwaysOn: boolean;
  alwaysOn: boolean;
  difficulty: Difficulty;
  music: number;
  onAlwaysOnChange: (checked: boolean) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onMusicChange: (value: number) => void;
  onBack: () => void;
};

const difficultyDescriptions: Record<Difficulty, string> = {
  relaxed: 'More forgiving scoring. Robots gain +1 per low-effort prompt.',
  normal: 'Balanced scoring. Both sides gain +2 per matching prompt.',
  strict: 'Higher standards. Robots gain +3 per low-effort prompt.',
};

export default function Settings({
  isActive,
  showAlwaysOn,
  alwaysOn,
  difficulty,
  music,
  onAlwaysOnChange,
  onDifficultyChange,
  onMusicChange,
  onBack,
}: SettingsProps) {
  const [saveMessage, setSaveMessage] = useState('');

  function handleSave() {
    setSaveMessage('Settings saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  }

  function handleReset() {
    onDifficultyChange('normal');
    onMusicChange(30);
    if (showAlwaysOn) {
      onAlwaysOnChange(true);
    }
    setSaveMessage('Reset to defaults!');
    setTimeout(() => setSaveMessage(''), 2000);
  }

  return (
    <section className={`panel ${isActive ? 'active' : ''}`}>
      <h2>Game Settings</h2>
      {showAlwaysOn && (
        <label className="toggle-row">
          <span>Always On</span>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={alwaysOn}
              onChange={(event) => onAlwaysOnChange(event.target.checked)}
              id="always-on-toggle"
            />
            <span className="toggle-slider"></span>
          </div>
        </label>
      )}

      <label className="field-row">
        Difficulty
        <select
          value={difficulty}
          onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
          className="settings-select"
        >
          <option value="relaxed">Relaxed</option>
          <option value="normal">Normal</option>
          <option value="strict">Strict</option>
        </select>
      </label>
      <p className="difficulty-desc">{difficultyDescriptions[difficulty]}</p>

      <label className="field-row">
        <span>Music Volume: {music}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={music}
          onChange={(event) => onMusicChange(Number(event.target.value))}
          className="music-slider"
        />
      </label>

      {saveMessage && <div className="save-feedback">{saveMessage}</div>}

      <div className="settings-actions">
        <button className="secondary-btn" onClick={handleSave}>
          Save
        </button>
        <button className="secondary-btn reset-btn" onClick={handleReset}>
          Reset
        </button>
        <button className="secondary-btn" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}