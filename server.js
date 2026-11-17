const http = require('http');
const WebSocket = require('ws');

// Crear servidor HTTP nativo para mantener activo el servicio en Render
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CIPHER RELAY ACTIVO Y SEGURO\n');
});

// Acoplar el servidor WebSocket (ws) al servidor HTTP
const wss = new WebSocket.Server({ server });

// Mapas en memoria para los nodos activos y el buzón temporal cifrado
const clients = new Map();
const offlineInbox = new Map();

wss.on('connection', (ws) => {
  let userCode = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // 1. Registro del nodo en la red
      if (data.type === 'register' && data.code) {
        userCode = data.code.toUpperCase();
        clients.set(userCode, ws);
        console.log(`[CONECTADO] Nodo registrado: ${userCode}`);

        // Entregar buzón pendiente cifrado si el usuario estaba offline
        if (offlineInbox.has(userCode)) {
          const pendingPackets = offlineInbox.get(userCode);
          pendingPackets.forEach(pkt => ws.send(JSON.stringify(pkt)));
          offlineInbox.delete(userCode);
          console.log(`[BUZÓN] Entregados ${pendingPackets.length} paquetes a ${userCode}`);
        }
        return;
      }

      // 2. Enrutamiento de mensajes y solicitudes
      const targetCode = (data.to || data.target)?.toUpperCase();
      
      if (targetCode) {
        const targetSocket = clients.get(targetCode);

        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(JSON.stringify(data));
        } else {
          // Retener de forma segura en RAM si el destinatario está desconectado
          if (!offlineInbox.has(targetCode)) {
            offlineInbox.set(targetCode, []);
          }
          offlineInbox.get(targetCode).push(data);
          console.log(`[OFFLINE] Paquete retenido para: ${targetCode}`);
        }
      }
    } catch (e) {
      console.error('Error procesando mensaje en el servidor:', e);
    }
  });

  ws.on('close', () => {
    if (userCode) {
      clients.delete(userCode);
      console.log(`[DESCONECTADO] Nodo: ${userCode}`);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor relé nativo CIPHER ejecutándose en el puerto ${PORT}`);
});
