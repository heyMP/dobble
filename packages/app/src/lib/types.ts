import { SYMBOLS } from "./symbols"; 

export type Card = typeof SYMBOLS;

export type User = {
  name: string;
  clientId: string;
  id: string;
}
