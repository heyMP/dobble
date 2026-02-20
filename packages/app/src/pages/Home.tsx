import { Link } from 'react-router-dom';
import { gameRegistry } from '../games/registry';

export function Home() {
  const games = Object.values(gameRegistry);

  return (
    <div>
      <h1>Game Arena</h1>
      <p>Choose a game to play with friends in real time.</p>
      {games.length === 0 ? (
        <p>No games registered yet. Check back soon!</p>
      ) : (
        <ul>
          {games.map((entry) => (
            <li key={entry.definition.id}>
              <Link to={`/${entry.definition.id}`}>
                <h2>{entry.definition.name}</h2>
                <p>{entry.definition.description}</p>
                <p>
                  {entry.definition.minPlayers}–{entry.definition.maxPlayers} players
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
