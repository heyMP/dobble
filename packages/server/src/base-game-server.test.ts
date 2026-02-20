import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Party from 'partykit/server';
import { BaseGameServer } from './base-game-server';

// --- Mock factories ---

function mockRoom(): Party.Room {
  return { broadcast: vi.fn() } as unknown as Party.Room;
}

function mockConnection(id: string): Party.Connection {
  return { id, send: vi.fn() } as unknown as Party.Connection;
}

const mockCtx = {} as Party.ConnectionContext;

// --- Concrete subclass for testing ---

type TestState = { counter: number };
type TestClientEvent = { type: 'test:increment' };
type TestBroadcastEvent = { type: 'test:state'; counter: number };

class TestGameServer extends BaseGameServer<TestState, TestClientEvent, TestBroadcastEvent> {
  createInitialState(): TestState {
    return { counter: 0 };
  }

  handleGameEvent(event: TestClientEvent, sender: Party.Connection): void {
    if (event.type === 'test:increment') {
      this.gameState.counter++;
      this.broadcastToAll({ type: 'test:state', counter: this.gameState.counter });
    }
  }

  getGameStateForClient(): TestBroadcastEvent[] {
    if (!this.gameState) return [];
    return [{ type: 'test:state', counter: this.gameState.counter }];
  }
}

// --- Helpers ---

function parsed(mock: ReturnType<typeof vi.fn>, callIndex = 0): unknown {
  return JSON.parse(mock.mock.calls[callIndex][0]);
}

function allParsed(mock: ReturnType<typeof vi.fn>): unknown[] {
  return mock.mock.calls.map((call: [string, ...unknown[]]) => JSON.parse(call[0]));
}

function broadcastMessages(room: Party.Room): unknown[] {
  return allParsed(room.broadcast as ReturnType<typeof vi.fn>);
}

// --- Tests ---

describe('BaseGameServer', () => {
  let room: Party.Room;
  let server: TestGameServer;

  beforeEach(() => {
    room = mockRoom();
    server = new TestGameServer(room);
  });

  function joinPlayer(connId: string, clientId: string, name: string) {
    const conn = mockConnection(connId);
    server.onMessage(
      JSON.stringify({ type: 'player:join', clientId, name }),
      conn,
    );
    return conn;
  }

  describe('connect and sync', () => {
    it('sends room:sync with initial state on connect', () => {
      const conn = mockConnection('conn-1');
      server.onConnect(conn, mockCtx);

      expect(conn.send).toHaveBeenCalledTimes(1);
      expect(parsed(conn.send as ReturnType<typeof vi.fn>)).toEqual({
        type: 'room:sync',
        phase: 'lobby',
        players: [],
        scores: {},
      });
    });
  });

  describe('player join', () => {
    it('broadcasts player:joined when a player joins', () => {
      joinPlayer('conn-1', 'client-1', 'Alice');

      const messages = broadcastMessages(room);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        type: 'player:joined',
        players: [{ id: 'conn-1', clientId: 'client-1', name: 'Alice' }],
      });
    });

    it('includes all players when a second player joins', () => {
      joinPlayer('conn-1', 'client-1', 'Alice');
      joinPlayer('conn-2', 'client-2', 'Bob');

      const messages = broadcastMessages(room);
      expect(messages).toHaveLength(2);
      expect(messages[1]).toEqual({
        type: 'player:joined',
        players: [
          { id: 'conn-1', clientId: 'client-1', name: 'Alice' },
          { id: 'conn-2', clientId: 'client-2', name: 'Bob' },
        ],
      });
    });
  });

  describe('player reconnect', () => {
    it('updates connection id without duplicating when same clientId reconnects', () => {
      joinPlayer('conn-1', 'client-1', 'Alice');
      joinPlayer('conn-NEW', 'client-1', 'Alice');

      const messages = broadcastMessages(room);
      expect(messages).toHaveLength(2);
      expect(messages[1]).toEqual({
        type: 'player:joined',
        players: [{ id: 'conn-NEW', clientId: 'client-1', name: 'Alice' }],
      });
    });
  });

  describe('game start', () => {
    it('transitions to playing phase and broadcasts phase:changed', () => {
      joinPlayer('conn-1', 'client-1', 'Alice');
      (room.broadcast as ReturnType<typeof vi.fn>).mockClear();

      server.onMessage(JSON.stringify({ type: 'game:start' }), mockConnection('conn-1'));

      const messages = broadcastMessages(room);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({ type: 'phase:changed', phase: 'playing' });
    });
  });

  describe('late joiner sync', () => {
    it('receives room:sync with playing phase and game state', () => {
      joinPlayer('conn-1', 'client-1', 'Alice');
      server.onMessage(JSON.stringify({ type: 'game:start' }), mockConnection('conn-1'));

      const lateConn = mockConnection('conn-late');
      server.onConnect(lateConn, mockCtx);

      const messages = allParsed(lateConn.send as ReturnType<typeof vi.fn>);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toMatchObject({ type: 'room:sync', phase: 'playing' });
      expect(messages[1]).toEqual({ type: 'test:state', counter: 0 });
    });
  });

  describe('game event routing', () => {
    it('forwards game-specific events to handleGameEvent', () => {
      joinPlayer('conn-1', 'client-1', 'Alice');
      server.onMessage(JSON.stringify({ type: 'game:start' }), mockConnection('conn-1'));
      (room.broadcast as ReturnType<typeof vi.fn>).mockClear();

      server.onMessage(
        JSON.stringify({ type: 'test:increment' }),
        mockConnection('conn-1'),
      );

      const messages = broadcastMessages(room);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({ type: 'test:state', counter: 1 });
    });
  });

  describe('player leave', () => {
    it('removes the player and broadcasts player:left', () => {
      const conn1 = joinPlayer('conn-1', 'client-1', 'Alice');
      joinPlayer('conn-2', 'client-2', 'Bob');
      (room.broadcast as ReturnType<typeof vi.fn>).mockClear();

      server.onMessage(
        JSON.stringify({ type: 'player:leave', clientId: 'client-1' }),
        conn1,
      );

      const messages = broadcastMessages(room);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        type: 'player:left',
        players: [{ id: 'conn-2', clientId: 'client-2', name: 'Bob' }],
      });
    });
  });

  describe('connection close', () => {
    it('removes the player by connection id and broadcasts player:left', () => {
      const conn1 = joinPlayer('conn-1', 'client-1', 'Alice');
      joinPlayer('conn-2', 'client-2', 'Bob');
      (room.broadcast as ReturnType<typeof vi.fn>).mockClear();

      server.onClose(conn1);

      const messages = broadcastMessages(room);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        type: 'player:left',
        players: [{ id: 'conn-2', clientId: 'client-2', name: 'Bob' }],
      });
    });
  });

  describe('game reset', () => {
    it('resets phase, scores, and state, then broadcasts updates', () => {
      joinPlayer('conn-1', 'client-1', 'Alice');
      server.onMessage(JSON.stringify({ type: 'game:start' }), mockConnection('conn-1'));
      server.onMessage(JSON.stringify({ type: 'test:increment' }), mockConnection('conn-1'));
      (room.broadcast as ReturnType<typeof vi.fn>).mockClear();

      server.onMessage(JSON.stringify({ type: 'game:reset' }), mockConnection('conn-1'));

      const messages = broadcastMessages(room);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({ type: 'phase:changed', phase: 'lobby' });
      expect(messages[1]).toEqual({ type: 'scores:updated', scores: {} });
    });

    it('reinitializes game state so late joiner sees fresh state after reset', () => {
      joinPlayer('conn-1', 'client-1', 'Alice');
      server.onMessage(JSON.stringify({ type: 'game:start' }), mockConnection('conn-1'));
      server.onMessage(JSON.stringify({ type: 'test:increment' }), mockConnection('conn-1'));
      server.onMessage(JSON.stringify({ type: 'game:reset' }), mockConnection('conn-1'));

      const lateConn = mockConnection('conn-late');
      server.onConnect(lateConn, mockCtx);

      const messages = allParsed(lateConn.send as ReturnType<typeof vi.fn>);
      expect(messages[0]).toMatchObject({ type: 'room:sync', phase: 'lobby', scores: {} });
      expect(messages[1]).toEqual({ type: 'test:state', counter: 0 });
    });
  });
});
