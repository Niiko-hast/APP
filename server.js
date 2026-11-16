const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`[CIPHER RELAY] Servidor seguro corriendo en puerto ${PORT}`);

wss.on('connection', (ws) => {
  console.log('[+] Nuevo nodo seguro conectado');

  ws.on('message', (message) => {
    // Retransmitir el paquete cifrado a todos los demás clientes conectados en tiempo real
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('[-] Nodo desconectado');
  });

  ws.on('error', (err) => {
    console.error('[!]. Error en socket:', err);
  });
});
