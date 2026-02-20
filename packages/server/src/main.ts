import type * as Party from "partykit/server";

/**
 * Main party entry point required by PartyKit.
 * Game-specific logic lives in individual party modules (see partykit.json).
 */
export default class Main implements Party.Server {
  constructor(readonly room: Party.Room) {}
}

Main satisfies Party.Worker;
