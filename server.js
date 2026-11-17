const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // O WebSocket nativo según tu implementación actual
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Ruta HTTP básica para despertar el servidor en Render
app.get('/', (req, res) => {
  res.send('CIPHER RELAY ACTIVO Y SEGURO');
});

// Mapa para almacenar los sockets activos por su código de usuario: { CODE: socket }
const clients = new Map();

// Buzón temporal en RAM para mensajes y solicitudes dirigidas a usuarios desconectados
// Estructura: { TARGET_CODE: [ packet1, packet2, ... ] }
const offlineInbox = new Map();

wss.on('connection', (ws) => {
  let userCode = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // 1. Registro o identificación del nodo en la conexión
      if (data.type === 'register' && data.code) {
        userCode = data.code.toUpperCase();
        clients.set(userCode, ws);
        console.log(`[CONECTADO] Nodo registrado: ${userCode}`);

        // Entregar buzón pendiente si lo hubiera
        if (offlineInbox.has(userCode)) {
          const pendingPackets = offlineInbox.get(userCode);
          pendingPackets.forEach(pkt => ws.send(JSON.stringify(pkt)));
          offlineInbox.delete(userCode);
          console.log(`[BUZÓN] Entregados ${pendingPackets.length} paquetes pendientes a ${userCode}`);
        }
        return;
      }

      // 2. Enrutamiento de paquetes (Mensajes, Solicitudes, ACKs, Respuestas)
      const targetCode = (data.to || data.target)?.toUpperCase();
      
      if (targetCode) {
        const targetSocket = clients.get(targetCode);

        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          // Si el destinatario está en línea, entregar de inmediato
          targetSocket.send(JSON.stringify(data));
        } else {
          // Si está desconectado, guardar temporalmente en la RAM del servidor (Buzón ciego cifrado)
          if (!offlineInbox.has(targetCode)) {
            offlineInbox.set(targetCode, []);
          }
          offlineInbox.get(targetCode).push(data);
          console.log(`[OFFLINE] Paquete retenido en buzón para nodo inactivo: ${targetCode}`);
        }
      }
    } catch (e) {
      console.error('Error procesando paquete en el servidor:', e);
    }
  });

  ws.on('close', () => {
    if (userCode) {
      clients.delete(userCode);
      console.log(`[DESCONECTADO] Nodo desconectado: ${userCode}`);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor relé CIPHER ejecutándose en el puerto ${PORT}`);
});
