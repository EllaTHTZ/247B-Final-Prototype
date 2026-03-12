import { AvatarConfig, AvatarDisplay } from './AvatarEditor';

type LeaderboardProps = {
  isActive: boolean;
  currentAvatarConfig: AvatarConfig;
  onBack: () => void;
};

type LeaderboardEntry = {
  rank: number;
  avatar: string;
  name: string;
  score: number;
  isCurrentUser: boolean;
};

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, avatar: '🧙', name: 'Friend 3',  score: 2847, isCurrentUser: false },
  { rank: 2, avatar: '🦸', name: 'Friend 39', score: 2620, isCurrentUser: false },
  { rank: 3, avatar: '🥷', name: 'Friend 21', score: 2503, isCurrentUser: false },
  { rank: 4, avatar: '🧑‍💻', name: 'You',       score: 1892, isCurrentUser: true  },
  { rank: 5, avatar: '👩‍🔬', name: 'Friend 1',  score: 1745, isCurrentUser: false },
  { rank: 6, avatar: '🤠', name: 'Friend 34', score: 1598, isCurrentUser: false },
  { rank: 7, avatar: '🐱', name: 'Friend 20', score: 1401, isCurrentUser: false },
  { rank: 8, avatar: '🐸', name: 'Friend 16', score: 1287, isCurrentUser: false },
];

const MAX_SCORE = mockLeaderboard[0].score;

export default function Leaderboard({ isActive, currentAvatarConfig, onBack }: LeaderboardProps) {
  const entries = mockLeaderboard;

  const podium  = entries.slice(0, 3);
  const restRaw = entries.slice(3);

  return (
    <section className={`panel ${isActive ? 'active' : ''}`}>

      {/* ── header ── */}
      <div className="lb-header">
        <span className="lb-title">🏆 Leaderboard</span>
        <span className="lb-subtitle">Human Resistance Points</span>
      </div>

      {/* ── podium ── */}
      <div className="lb-podium">
        {/* reorder so 2nd is left, 1st centre, 3rd right */}
        {[podium[1], podium[0], podium[2]].map((e, col) => {
          const heights = ['64px', '88px', '52px'];   // left / centre / right
          const labels  = ['2ND', '1ST', '3RD'];
          return (
            <div key={e.rank} className={`lb-podium-col lb-podium-col--${col}`}>
              <div className="lb-podium-avatar">{e.avatar}</div>
              <div className="lb-podium-name">{e.name}</div>
              <div className="lb-podium-score">{e.score.toLocaleString()}</div>
              <div
                className={`lb-podium-block lb-podium-block--${col}`}
                style={{ height: heights[col] }}
              >
                <span className="lb-podium-place">{labels[col]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── rest of list ── */}
      <div className="lb-list">
        {restRaw.map((e) => {
          const pct = Math.round((e.score / MAX_SCORE) * 100);
          return (
            <div key={e.rank} className={`lb-row${e.isCurrentUser ? ' lb-row--you' : ''}`}>
              <span className="lb-row-rank">{e.rank}</span>
              <span className="lb-row-avatar">
                {e.isCurrentUser ? (
                  <AvatarDisplay config={currentAvatarConfig} width={22} height={28} />
                ) : (
                  e.avatar
                )}
              </span>
              <div className="lb-row-info">
                <div className="lb-row-top">
                  <span className="lb-row-name">{e.name}</span>
                  <span className="lb-row-score">{e.score.toLocaleString()}</span>
                </div>
                <div className="lb-bar-track">
                  <div className="lb-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="secondary-btn" style={{ marginTop: '0.6rem' }} onClick={onBack}>
        ← Back
      </button>
    </section>
  );
}
