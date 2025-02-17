import {SignalWatcher, signal} from '@lit-labs/preact-signals';
import PartySocket from "partysocket";
import type { Card, User } from './lib/types.ts';

function getClientId() {
  const ss = sessionStorage.getItem('dobble-client-id');
  if (ss) {
    return ss;
  }
  const id = crypto.randomUUID();
  sessionStorage.setItem('dobble-client-id', id);
  return id;
}

export class PartyKitRoom {
  private partySocket: PartySocket;

  private clientId = getClientId();

  cards = signal<Card[]>([]);

  users = signal<User[]>([]);

  currentIndex = signal(0);

  constructor(public roomId: string) {
    // connect to our server
    this.partySocket = new PartySocket({
      host: "localhost:1999",
      room: this.roomId,
    });

    this.init();
  }

  init() {
    this.partySocket.addEventListener('open', e => {
      // send a message to the server
      this.partySocket.send(JSON.stringify({
        type: 'user-entry',
        name: 'heymp',
        clientId: this.clientId,
      }));
    });

    this.partySocket.addEventListener('close', e => {
      // send a message to the server
      this.partySocket.send(JSON.stringify({
        type: 'user-exit',
        clientId: this.clientId,
      }));
    });

    // print each incoming message from the server to console
    this.partySocket.addEventListener("message", (e) => {
      const event = JSON.parse(e.data);
      if (event.type === 'users-update') {
        this.users.value = event.users;
      }

      if (event.type === 'cards-update') {
        this.cards.value = event.cards;
        this.currentIndex.value = event.currentIndex;
      }

      if (event.type === 'matched') {
        console.log(event);
        this.currentIndex.value = event.currentIndex;
      }
    });
  }

  match() {
    this.partySocket.send(JSON.stringify({
      type: 'match',
      clientId: this.clientId,
    }));
  }
}

