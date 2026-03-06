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
  return (
    <section className={`panel ${isActive ? 'active' : ''}`}>
      <h2>Game Settings</h2>
      {showAlwaysOn && (
        <label className="toggle-row">
          <span>Always On</span>
          <input type="checkbox" checked={alwaysOn} onChange={(event) => onAlwaysOnChange(event.target.checked)} />
        </label>
      )}

      <label className="field-row">
        Difficulty
        <select
          value={difficulty}
          onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
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
          onChange={(event) => onMusicChange(Number(event.target.value))}
        />
      </label>

      <button className="secondary-btn" onClick={onBack}>
        Back
      </button>
    </section>
  );
}
