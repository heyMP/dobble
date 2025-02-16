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

export type BroadCastEvent =
  | { type: 'cards-update', cards: Card[] }
  | { type: 'users-update', users: User[] }

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) { }

  users: User[] = [];

  cards: Card[] = [];

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
      } as BroadCastEvent),
    );
  }

  removeUser(clientId: User['clientId']) {
    this.users = this.users.filter(i => i.clientId !== clientId);
    this.room.broadcast(
      JSON.stringify({
        type: 'users-update',
        users: this.users
      } as BroadCastEvent),
    );
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    if (this.cards.length === 0) {
      this.cards = generate();
    }

    conn.send(JSON.stringify({
      type: 'cards-update',
      cards: this.cards,
    } as BroadCastEvent));

    conn.send(JSON.stringify({
      type: 'users-update',
      users: this.users,
    } as BroadCastEvent));
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

    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);
  }
}

Server satisfies Party.Worker;
