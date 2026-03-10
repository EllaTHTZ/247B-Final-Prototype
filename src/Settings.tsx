import { AvatarDisplay, AvatarConfig } from './AvatarEditor';

type Difficulty = 'relaxed' | 'normal' | 'strict';

type SettingsProps = {
  isActive: boolean;
  showAlwaysOn: boolean;
  alwaysOn: boolean;
  difficulty: Difficulty;
  music: number;
  avatarConfig: AvatarConfig;
  onAlwaysOnChange: (checked: boolean) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onMusicChange: (value: number) => void;
  onBack: () => void;
  onEditAvatar: () => void;
};

export default function Settings({
  isActive,
  showAlwaysOn,
  alwaysOn,
  difficulty,
  music,
  avatarConfig,
  onAlwaysOnChange,
  onDifficultyChange,
  onMusicChange,
  onBack,
  onEditAvatar,
}: SettingsProps) {
  return (
    <section className={`panel ${isActive ? 'active' : ''}`}>
      <div className="settings-top-row">
        <h2 className="settings-heading">Game Settings</h2>

        {/* Avatar profile card */}
        <button className="avatar-profile-card" onClick={onEditAvatar} title="Edit Avatar">
          <AvatarDisplay config={avatarConfig} size={52} />
          <span className="avatar-card-label">Edit Avatar</span>
        </button>
      </div>

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

      <button className="secondary-btn" style={{ marginTop: '0.5rem' }} onClick={onBack}>
        Back
      </button>
    </section>
  );
}
