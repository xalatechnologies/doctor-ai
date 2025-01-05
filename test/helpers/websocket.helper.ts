import * as WebSocket from 'ws';

export const connectToWebSocket = async (path: string): Promise<WebSocket> => {
  const ws = new WebSocket(`ws://localhost:3000${path}`);
  return new Promise((resolve) => {
    ws.on('open', () => resolve(ws));
  });
}; 