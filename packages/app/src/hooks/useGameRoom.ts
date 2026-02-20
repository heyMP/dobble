import { useRef, useEffect } from "react";
import { GameRoomStore } from "../store/GameRoomStore";

export function useGameRoom<TBroadcastEvent extends { type: string }>(
  gameType: string,
  roomId: string,
  playerName: string,
): GameRoomStore<TBroadcastEvent> {
  const storeRef = useRef<GameRoomStore<TBroadcastEvent> | null>(null);
  if (!storeRef.current) {
    storeRef.current = new GameRoomStore<TBroadcastEvent>(
      (import.meta.env.VITE_PARTYKIT_HOST as string | undefined) ??
        "localhost:1999",
      gameType,
      roomId,
      playerName,
    );
  }

  useEffect(() => {
    return () => {
      storeRef.current?.dispose();
      storeRef.current = null;
    };
  }, []);

  return storeRef.current;
}
