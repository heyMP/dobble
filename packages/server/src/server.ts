import type * as Party from "partykit/server";
import { generate, type Card } from './dobble';

type User = {
  id: string,
  clientId: string,
  name: string,
}

export type ServerEvent =
  | { type: 'user-entry', name: string, clientId: string }
  | { type: 'user-exit', clientId: string }
  | { type: 'match', clientId: string }

export type BroadCastEvent =
  | { type: 'cards-update', cards: Card[], currentIndex: number }
  | { type: 'users-update', users: User[] }
  | { type: 'matched', currentIndex: number }

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) { }

  users: User[] = [];

  cards: Card[] = [];

  currentIndex: number = 0;

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

    if (event.type === 'user-exit') {
      this.removeUser(event.clientId);
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

  removeUser(clientId: User['clientId']) {
    this.users = this.users.filter(i => i.clientId !== clientId);
    this.room.broadcast(
      JSON.stringify({
        type: 'users-update',
        users: this.users
      } satisfies BroadCastEvent),
    );
  }

  // @TODO: need to account for when we've reached the end
  match() {
    this.currentIndex = this.currentIndex + 2;

    this.room.broadcast(
      JSON.stringify({
        type: 'matched',
        currentIndex: this.currentIndex,
      } satisfies BroadCastEvent),
    );
  }
}

Server satisfies Party.Worker;
