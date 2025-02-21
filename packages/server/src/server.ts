import type * as Party from "partykit/server";
import { generate, type Card } from './dobble';

export type User = {
  id: string,
  clientId: string,
  name: string,
}

export type State = 'start' | 'playing';

export type Score = Record<User['clientId'], number>;

export type ServerEvent =
  | { type: 'user-entry', name: string, clientId: string }
  | { type: 'user-exit', clientId: string }
  | { type: 'match', clientId: string }
  | { type: 'start-game' }

export type BroadCastEvent =
  | { type: 'cards-update', cards: Card[], currentIndex: number }
  | { type: 'users-update', users: User[] }
  | { type: 'score-update', score: Score }
  | { type: 'matched', currentIndex: number }
  | { type: 'state-update', state: State }

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) { }

  cards: Card[] = [];

  currentIndex: number = 0;

  users: User[] = [];

  score: Score = {};

  state: State = 'start';

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    if (this.cards.length === 0) {
      this.cards = generate();
    }

    conn.send(JSON.stringify({
      type: 'cards-update',
      cards: this.cards,
      currentIndex: 0,
    } satisfies BroadCastEvent));

    conn.send(JSON.stringify({
      type: 'users-update',
      users: this.users,
    } satisfies BroadCastEvent));

    conn.send(JSON.stringify({
      type: 'score-update',
      score: this.score,
    } satisfies BroadCastEvent));

    conn.send(JSON.stringify({
      type: 'state-update',
      state: this.state,
    } satisfies BroadCastEvent));
  }

  onClose(connection: Party.Connection): void | Promise<void> {
    this.removeUser(connection.id);
  }

  onMessage(message: string, sender: Party.Connection) {
    const event = JSON.parse(message) as ServerEvent;

    if (event.type === 'user-entry') {
      this.addUser({
        name: event.name,
        clientId: event.clientId,
        id: sender.id
      });
    }

    if (event.type === 'start-game') {
      this.startGame();
    }

    if (event.type === 'match') {
      this.match(event);
    }

    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);
  }

  addUser(user: User) {
    const existingUserIndex = this.users.findIndex(i => i.clientId === user.clientId);

    if (existingUserIndex !== -1) {
      this.users[existingUserIndex] = {
        ...user
      }
    }
    else {
      this.users.push({
        name: user.name,
        clientId: user.clientId,
        id: user.id
      });
    }

    this.room.broadcast(
      JSON.stringify({
        type: 'users-update',
        users: this.users
      } satisfies BroadCastEvent),
    );
  }

  removeUser(id: User['id']) {
    this.users = this.users.filter(i => i.id !== id);
    this.room.broadcast(
      JSON.stringify({
        type: 'users-update',
        users: this.users
      } satisfies BroadCastEvent),
    );
  }

  // @TODO: need to account for when we've reached the end
  match(event: Extract<ServerEvent, { type: 'match' }>) {
    this.score[event.clientId] = (this.score[event.clientId] ?? 0) + 1;

    this.room.broadcast(
      JSON.stringify({
        type: 'score-update',
        score: this.score,
      } satisfies BroadCastEvent),
    );

    this.currentIndex = this.currentIndex + 2;
    this.room.broadcast(
      JSON.stringify({
        type: 'matched',
        currentIndex: this.currentIndex,
      } satisfies BroadCastEvent),
    );
  }

  startGame() {
    this.state = 'playing';
    this.room.broadcast(
      JSON.stringify({
        type: 'state-update',
        state: this.state,
      } satisfies BroadCastEvent),
    );
  }
}

Server satisfies Party.Worker;
