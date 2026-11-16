const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

// 1. Servidor HTTP básico para satisfacer los controles de salud de Render
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CIPHER RELAY ACTIVO\n');
});

// 2. Acoplar el servidor WebSocket al servidor HTTP (compatible con el proxy de Render)
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('[+] Nodo seguro conectado');

  ws.on('message', (message) => {
    // Retransmitir el paquete cifrado a todos los demás clientes en tiempo real
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
    console.error('[!] Error en socket:', err);
  });
});

// Iniciar el servidor unificado en el puerto asignado por Render
server.listen(PORT, () => {
  console.log(`[CIPHER RELAY] Servidor seguro corriendo en puerto ${PORT}`);
});
