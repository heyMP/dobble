import { useRef } from 'react';
import { useSignal } from '@preact/signals-react';
import { batch } from '@preact/signals-react';
import { useGameRoom } from '../../hooks/useGameRoom';
import type { BroadcastEvent } from '../../hooks/useGameRoom';
import { SYMBOLS_PER_CARD } from 'shared/games/dobble/types';
import type { Card } from 'shared/games/dobble/types';
import './DobbleGame.css';

interface Props {
  roomId: string;
  playerName: string;
}

const SYMBOL_POSITIONS = (() => {
  const positions: { x: number; y: number; size: number }[] = [];
  positions.push({ x: 50, y: 50, size: 2.8 });
  const ring = SYMBOLS_PER_CARD - 1;
  const sizes = [2.2, 1.8, 2.4, 1.7, 2.1, 1.9, 2.3];
  for (let i = 0; i < ring; i++) {
    const angle = (i * 2 * Math.PI) / ring - Math.PI / 2;
    const radius = 33;
    positions.push({
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      size: sizes[i],
    });
  }
  return positions;
})();

export function DobbleGame({ roomId, playerName }: Props) {
  const room = useGameRoom(roomId, playerName);
  const cards = useSignal<Card[]>([]);
  const currentIndex = useSignal(0);

  const eventRegistered = useRef(false);
  if (!eventRegistered.current) {
    eventRegistered.current = true;
    room.onMessage((event: BroadcastEvent) => {
      if (event.type === 'cards-update') {
        batch(() => {
          cards.value = event.cards as Card[];
          currentIndex.value = event.currentIndex;
        });
      } else if (event.type === 'matched') {
        currentIndex.value = event.currentIndex;
      }
    });
  }

  if (room.state.value === 'start') {
    return (
      <div className="dobble-lobby">
        <h1>Dobble</h1>
        <p className="room-code">
          Room: <strong>{roomId}</strong>
        </p>
        <div className="player-list">
          <h2>Players ({room.users.value.length})</h2>
          <ul>
            {room.users.value.map((u) => (
              <li key={u.clientId}>{u.name}</li>
            ))}
          </ul>
        </div>
        {room.users.value.length >= 2 ? (
          <button className="start-btn" onClick={() => room.startGame()}>
            Start Game
          </button>
        ) : (
          <p className="waiting-msg">Waiting for at least 2 players...</p>
        )}
      </div>
    );
  }

  const idx = currentIndex.value;
  const card1 = idx < cards.value.length ? cards.value[idx] : null;
  const card2 = idx + 1 < cards.value.length ? cards.value[idx + 1] : null;
  const pairsLeft =
    cards.value.length > 0
      ? Math.floor((cards.value.length - idx) / 2)
      : 0;

  if (!card1 || !card2) {
    const sorted = Object.entries(room.score.value).sort(
      ([, a], [, b]) => b - a,
    );

    return (
      <div className="dobble-finished">
        <h1>Game Over!</h1>
        <div className="final-scores">
          <h2>Final Scores</h2>
          <ol>
            {sorted.map(([clientId, score], i) => {
              const user = room.users.value.find(
                (u) => u.clientId === clientId,
              );
              return (
                <li key={clientId} className={i === 0 ? 'winner' : ''}>
                  <span className="player-name">
                    {user?.name ?? 'Unknown'}
                  </span>
                  <span className="player-score">{score}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  }

  const card2Set = new Set(card2);
  const matchingSymbol = card1.find((s) => card2Set.has(s)) ?? null;

  const handleSymbolClick = (symbol: string) => {
    if (symbol === matchingSymbol) {
      room.sendMatch();
    }
  };

  const sorted = Object.entries(room.score.value).sort(
    ([, a], [, b]) => b - a,
  );

  return (
    <div className="dobble-playing">
      <div className="game-header">
        <h1>Dobble</h1>
        <p className="pairs-remaining">{pairsLeft} pairs left</p>
      </div>

      <div className="dobble-cards">
        <DobbleCard card={card1} onSymbolClick={handleSymbolClick} />
        <DobbleCard card={card2} onSymbolClick={handleSymbolClick} />
      </div>

      <div className="scoreboard">
        <h3>Scores</h3>
        <ul>
          {sorted.length > 0
            ? sorted.map(([clientId, score]) => {
                const user = room.users.value.find(
                  (u) => u.clientId === clientId,
                );
                return (
                  <li key={clientId}>
                    <span>{user?.name ?? 'Unknown'}</span>
                    <span className="score-value">{score}</span>
                  </li>
                );
              })
            : room.users.value.map((u) => (
                <li key={u.clientId}>
                  <span>{u.name}</span>
                  <span className="score-value">0</span>
                </li>
              ))}
        </ul>
      </div>
    </div>
  );
}

function DobbleCard({
  card,
  onSymbolClick,
}: {
  card: Card;
  onSymbolClick: (symbol: string) => void;
}) {
  return (
    <div className="dobble-card">
      {card.map((symbol, i) => {
        const pos = SYMBOL_POSITIONS[i];
        return (
          <button
            key={`${symbol}-${i}`}
            className="dobble-symbol"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              fontSize: `${pos.size}rem`,
            }}
            onClick={() => onSymbolClick(symbol)}
          >
            {symbol}
          </button>
        );
      })}
    </div>
  );
}
