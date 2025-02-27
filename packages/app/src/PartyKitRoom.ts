import { signal } from '@lit-labs/preact-signals';
import PartySocket from "partysocket";
import type { Card } from './lib/types.ts';
import type { BroadCastEvent, ServerEvent, User, Score, State } from 'server';

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

  score = signal<Score>({});

  state = signal<State | 'loading'>('loading');

  constructor(public roomId: string, public name: string) {
    // connect to our server
    this.partySocket = new PartySocket({
      host: import.meta.env.VITE_PARTYKIT_HOST,
      room: roomId,
    });

    this.init();
  }

  init() {
    this.partySocket.addEventListener('open', () => {
      // send a message to the server
      console.log(this.name)
      this.partySocket.send(JSON.stringify({
        type: 'user-entry',
        name: this.name,
        clientId: this.clientId,
      }));
    });

    this.partySocket.addEventListener('close', () => {
      // send a message to the server
      this.partySocket.send(JSON.stringify({
        type: 'user-exit',
        clientId: this.clientId,
      }));
    });

    // print each incoming message from the server to console
    this.partySocket.addEventListener("message", (e) => {
      const event = JSON.parse(e.data) as BroadCastEvent;
      if (event.type === 'users-update') {
        this.users.value = event.users;
      }

      if (event.type === 'cards-update') {
        this.cards.value = event.cards;
        this.currentIndex.value = event.currentIndex;
      }

      if (event.type === 'score-update') {
        this.score.value = event.score;
      }

      if (event.type === 'matched') {
        this.currentIndex.value = event.currentIndex;
      }

      if (event.type === 'matched') {
        this.currentIndex.value = event.currentIndex;
      }

      if (event.type === 'state-update') {
        this.state.value = event.state;
      }
    });
  }

  match() {
    const event: ServerEvent = {
      type: 'match',
      clientId: this.clientId,
    };
    this.partySocket.send(JSON.stringify(event));
  }

  getUserScore(clientId: User['clientId']) {
    return this.score.value[clientId] ?? 0;
  }

  startGame() {
    const event: ServerEvent = {
      type: 'start-game'
    };
    this.partySocket.send(JSON.stringify(event));
  }
}

