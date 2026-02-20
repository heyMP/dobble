import { useNavigate, useParams } from 'react-router-dom';
import { useSignal } from '@preact/signals-react';
import { gameRegistry } from '../games/registry';

export function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const playerName = useSignal('');
  const roomCode = useSignal('');

  const entry = gameId ? gameRegistry[gameId] : undefined;

  if (!entry) {
    return <p>Game not found.</p>;
  }

  const handleCreate = () => {
    if (!playerName.value.trim()) return;
    const newRoomId = crypto.randomUUID().slice(0, 8);
    navigate(`/${gameId}/${newRoomId}?name=${encodeURIComponent(playerName.value.trim())}`);
  };

  const handleJoin = () => {
    if (!playerName.value.trim() || !roomCode.value.trim()) return;
    navigate(`/${gameId}/${roomCode.value.trim()}?name=${encodeURIComponent(playerName.value.trim())}`);
  };

  return (
    <div>
      <h1>{entry.definition.name}</h1>
      <p>{entry.definition.description}</p>

      <div>
        <label>
          Your Name
          <input
            type="text"
            value={playerName.value}
            onChange={(e) => (playerName.value = e.target.value)}
            placeholder="Enter your name"
          />
        </label>
      </div>

      <div>
        <h2>Create a Room</h2>
        <button onClick={handleCreate} disabled={!playerName.value.trim()}>
          Create New Room
        </button>
      </div>

      <div>
        <h2>Join a Room</h2>
        <label>
          Room Code
          <input
            type="text"
            value={roomCode.value}
            onChange={(e) => (roomCode.value = e.target.value)}
            placeholder="Enter room code"
          />
        </label>
        <button
          onClick={handleJoin}
          disabled={!playerName.value.trim() || !roomCode.value.trim()}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
