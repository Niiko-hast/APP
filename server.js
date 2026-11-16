const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`[CIPHER RELAY] Servidor seguro corriendo en puerto ${PORT}`);

wss.on('connection', (ws) => {
  console.log('[+] Nuevo nodo conectado a la red.');

  ws.on('message', (message) => {
    // Reenviar el paquete cifrado a todos los demás nodos conectados (socio)
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('[-] Nodo desconectado.');
  });
});
