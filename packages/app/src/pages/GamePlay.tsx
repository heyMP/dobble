import { useParams, useSearchParams } from 'react-router-dom';
import { gameRegistry } from '../games/registry';

export function GamePlay() {
  const { gameId, roomId } = useParams<{ gameId: string; roomId: string }>();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('name') ?? 'Anonymous';

  const entry = gameId ? gameRegistry[gameId] : undefined;

  if (!entry || !roomId) {
    return <p>Game not found.</p>;
  }

  const GameComponent = entry.component;
  return <GameComponent roomId={roomId} playerName={playerName} />;
}
