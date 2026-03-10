export type GameRecord = {
  date: string;
  winner: 'humans' | 'robots';
  humanScore: number;
  robotScore: number;
  difficulty: string;
  intentional: number;
  lowEffort: number;
};

type StatsProps = {
  isActive: boolean;
  history: GameRecord[];
  onBack: () => void;
};

export default function Stats({ isActive, history, onBack }: StatsProps) {
  const totalGames = history.length;
  const humanWins = history.filter((g) => g.winner === 'humans').length;
  const robotWins = totalGames - humanWins;
  const totalIntentional = history.reduce((s, g) => s + g.intentional, 0);
  const totalLowEffort = history.reduce((s, g) => s + g.lowEffort, 0);
  const totalPrompts = totalIntentional + totalLowEffort;
  const intentionalRate = totalPrompts > 0 ? Math.round((totalIntentional / totalPrompts) * 100) : 0;
  const recent = history.slice(-5).reverse();

  return (
    <section className={`panel ${isActive ? 'active' : ''}`}>
      <h2>Your Stats</h2>

      {totalGames === 0 ? (
        <p className="stats-empty">No games yet. Complete a round to see stats here.</p>
      ) : (
        <>
          <div className="stats-summary">
            <div className="stat-box">
              <span className="stat-value">{totalGames}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{humanWins}</span>
              <span className="stat-label">Human wins</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{robotWins}</span>
              <span className="stat-label">Robot wins</span>
            </div>
          </div>

          <div className="stats-section">
            <p className="stats-section-label">Prompt quality ({totalPrompts} total)</p>
            <div className="stats-bar-row">
              <span className="bar-label">Intentional</span>
              <div className="stats-bar-track">
                <div className="stats-bar intentional-bar" style={{ width: `${intentionalRate}%` }} />
              </div>
              <span className="bar-pct">{intentionalRate}%</span>
            </div>
            <div className="stats-bar-row">
              <span className="bar-label">Low-effort</span>
              <div className="stats-bar-track">
                <div className="stats-bar low-effort-bar" style={{ width: `${100 - intentionalRate}%` }} />
              </div>
              <span className="bar-pct">{100 - intentionalRate}%</span>
            </div>
          </div>

          <div className="stats-section">
            <p className="stats-section-label">Recent games</p>
            <div className="stats-history">
              {recent.map((g, i) => {
                const total = g.intentional + g.lowEffort;
                const rate = total > 0 ? Math.round((g.intentional / total) * 100) : 0;
                const d = new Date(g.date);
                const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return (
                  <div key={i} className="stats-history-row">
                    <span className="history-date">{label}</span>
                    <span className={`history-result ${g.winner}`}>{g.winner === 'humans' ? 'Win' : 'Loss'}</span>
                    <span className="history-score">{g.humanScore}–{g.robotScore}</span>
                    <span className="history-quality">{rate}% intentional</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <button className="secondary-btn" onClick={onBack}>
        Back
      </button>
    </section>
  );
}
