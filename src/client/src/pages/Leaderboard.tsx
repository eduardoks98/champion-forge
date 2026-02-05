import { useSocket } from '../context/SocketContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import './Leaderboard.css';

interface PlayerRank {
  rank: number;
  username: string;
  displayName: string;
  wins: number;
  kills: number;
  winRate: number;
  level: number;
}

// Mock data - sera substituido por dados reais do servidor
const mockLeaderboard: PlayerRank[] = [
  { rank: 1, username: 'player1', displayName: 'DragonSlayer', wins: 150, kills: 1250, winRate: 75, level: 42 },
  { rank: 2, username: 'player2', displayName: 'ShadowBlade', wins: 142, kills: 1180, winRate: 71, level: 40 },
  { rank: 3, username: 'player3', displayName: 'ThunderStrike', wins: 138, kills: 1120, winRate: 69, level: 38 },
  { rank: 4, username: 'player4', displayName: 'IronFist', wins: 125, kills: 980, winRate: 63, level: 35 },
  { rank: 5, username: 'player5', displayName: 'NightHawk', wins: 118, kills: 920, winRate: 59, level: 33 },
  { rank: 6, username: 'player6', displayName: 'StormBringer', wins: 105, kills: 850, winRate: 53, level: 30 },
  { rank: 7, username: 'player7', displayName: 'BlazeFury', wins: 98, kills: 780, winRate: 49, level: 28 },
  { rank: 8, username: 'player8', displayName: 'FrostBite', wins: 92, kills: 720, winRate: 46, level: 26 },
  { rank: 9, username: 'player9', displayName: 'VenomStrike', wins: 85, kills: 680, winRate: 43, level: 24 },
  { rank: 10, username: 'player10', displayName: 'PhoenixRise', wins: 78, kills: 620, winRate: 39, level: 22 },
];

export default function Leaderboard() {
  const { onlineCount } = useSocket();

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'leaderboard__rank--gold';
    if (rank === 2) return 'leaderboard__rank--silver';
    if (rank === 3) return 'leaderboard__rank--bronze';
    return '';
  };

  return (
    <div className="leaderboard">
      <Header variant="full" onlineCount={onlineCount} />

      <main className="leaderboard__content">
        <div className="leaderboard__container">
          <h1 className="leaderboard__title">Ranking Global</h1>
          <p className="leaderboard__subtitle">Os melhores jogadores do Champion Forge</p>

          {/* Top 3 Podium */}
          <div className="leaderboard__podium">
            {mockLeaderboard.slice(0, 3).map((player, index) => (
              <div
                key={player.username}
                className={`leaderboard__podium-item leaderboard__podium-item--${index === 0 ? 'first' : index === 1 ? 'second' : 'third'}`}
              >
                <div className="leaderboard__podium-rank">
                  {index === 0 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                  <span>#{player.rank}</span>
                </div>
                <div className="leaderboard__podium-avatar">
                  {player.displayName.charAt(0).toUpperCase()}
                </div>
                <h3 className="leaderboard__podium-name">{player.displayName}</h3>
                <p className="leaderboard__podium-stats">
                  {player.wins} vitorias | {player.winRate}% win rate
                </p>
                <span className="leaderboard__podium-level">Lv {player.level}</span>
              </div>
            ))}
          </div>

          {/* Full Leaderboard Table */}
          <div className="leaderboard__table-wrapper">
            <table className="leaderboard__table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Jogador</th>
                  <th>Level</th>
                  <th>Vitorias</th>
                  <th>Kills</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboard.map((player) => (
                  <tr key={player.username} className={getRankClass(player.rank)}>
                    <td className="leaderboard__rank-cell">
                      <span className={`leaderboard__rank ${getRankClass(player.rank)}`}>
                        #{player.rank}
                      </span>
                    </td>
                    <td className="leaderboard__player-cell">
                      <div className="leaderboard__player-avatar">
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span>{player.displayName}</span>
                    </td>
                    <td>
                      <span className="leaderboard__level">Lv {player.level}</span>
                    </td>
                    <td>{player.wins}</td>
                    <td>{player.kills}</td>
                    <td>
                      <span className="leaderboard__winrate">{player.winRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info Notice */}
          <div className="leaderboard__notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <p>O ranking e atualizado a cada hora. Jogue partidas ranqueadas para aparecer no ranking!</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
