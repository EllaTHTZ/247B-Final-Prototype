type LeaderboardProps = {
  isActive: boolean;
  currentAvatar: string;
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
  { rank: 1, avatar: '🧙', name: 'Friend 3', score: 2847, isCurrentUser: false },
  { rank: 2, avatar: '🦸', name: 'Friend 39', score: 2620, isCurrentUser: false },
  { rank: 3, avatar: '🥷', name: 'Friend 21', score: 2503, isCurrentUser: false },
  { rank: 4, avatar: '🧑‍💻', name: 'You', score: 1892, isCurrentUser: true },
  { rank: 5, avatar: '👩‍🔬', name: 'Friend 1', score: 1745, isCurrentUser: false },
  { rank: 6, avatar: '🤠', name: 'Friend 34', score: 1598, isCurrentUser: false },
  { rank: 7, avatar: '🐱', name: 'Friend 20', score: 1401, isCurrentUser: false },
  { rank: 8, avatar: '🐸', name: 'Friend 16', score: 1287, isCurrentUser: false },
];

export default function Leaderboard({ isActive, currentAvatar, onBack }: LeaderboardProps) {
  const leaderboardWithCurrentAvatar = mockLeaderboard.map((entry) =>
    entry.isCurrentUser ? { ...entry, avatar: currentAvatar } : entry
  );

  return (
    <section className={`panel ${isActive ? 'active' : ''}`}>
      <h2>Leaderboard</h2>
      <p className="leaderboard-subtitle">Human Resistance Points</p>

      <div className="leaderboard-list">
        {leaderboardWithCurrentAvatar.map((entry) => (
          <div
            key={entry.rank}
            className={`leaderboard-row ${entry.isCurrentUser ? 'current-user' : ''} ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}
          >
            <div className="leaderboard-rank">
              {entry.rank === 1 && <span className="rank-badge gold">1st</span>}
              {entry.rank === 2 && <span className="rank-badge silver">2nd</span>}
              {entry.rank === 3 && <span className="rank-badge bronze">3rd</span>}
              {entry.rank > 3 && <span className="rank-number">{entry.rank}</span>}
            </div>
            <div className="leaderboard-player">
              <span className="player-avatar">{entry.avatar}</span>
              <span className="player-name">{entry.name}</span>
            </div>
            <div className="leaderboard-score">{entry.score.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <button className="secondary-btn" onClick={onBack}>
        Back
      </button>
    </section>
  );
}