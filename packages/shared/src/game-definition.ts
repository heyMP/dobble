export interface GameDefinition {
  /** Unique identifier, must match the party name in partykit.json */
  id: string;
  /** Display name shown in the UI */
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}
