import PartySocket from "partysocket";

function getClientId() {
  const ss = sessionStorage.getItem('dobble-client-id');
  if (ss) {
    return ss;
  }
  const id = crypto.randomUUID();
  sessionStorage.setItem('dobble-client-id', id);
  return id;
}

export const partykit = (id: string): void => {
  // connect to our server
  const partySocket = new PartySocket({
    host: "localhost:1999",
    room: id,
  });

  partySocket.addEventListener('open', e => {
    const clientId = getClientId();
    // send a message to the server
    partySocket.send(JSON.stringify({
      type: 'user-entry',
      name: 'heymp',
      clientId: clientId,
    }));
  });

  partySocket.addEventListener('close', e => {
    const clientId = getClientId();
    // send a message to the server
    partySocket.send(JSON.stringify({
      type: 'user-exit',
      clientId: clientId,
    }));
  });

  // print each incoming message from the server to console
  partySocket.addEventListener("message", (e) => {
    const event = JSON.parse(e.data);
    if (event.type === 'users-update') {
      const users = event.users;
      console.log(users);
    }
  });
}

