import express from "express";
import { createServer as createViteServer } from "vite";
import os from "os";
import net from "net";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for real network discovery
  app.get("/api/discover", async (req, res) => {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    // Find local IPv4 addresses
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (iface.family === "IPv4" && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }

    if (addresses.length === 0) {
      return res.json({ devices: [], error: "No local network interface found" });
    }

    const baseIp = addresses[0].split(".").slice(0, 3).join(".");
    const discoveredDevices: any[] = [];
    const portsToScan = [80, 81, 502, 443, 8080, 1883]; // HTTP, WS, Modbus, HTTPS, Alt HTTP, MQTT
    
    // Scan a range of IPs
    const scanRange = Array.from({ length: 100 }, (_, i) => i + 1); // Scan first 100
    
    const scanPromises = scanRange.map(async (i) => {
      const targetIp = `${baseIp}.${i}`;
      
      if (targetIp === addresses[0]) return;

      for (const port of portsToScan) {
        try {
          await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(200); // Slightly longer timeout
            
            socket.on("connect", () => {
              socket.destroy();
              resolve(true);
            });
            
            socket.on("timeout", () => {
              socket.destroy();
              reject();
            });
            
            socket.on("error", () => {
              socket.destroy();
              reject();
            });
            
            socket.connect(port, targetIp);
          });

          let deviceType = "ARDUINO";
          if (port === 502) deviceType = "PLC";
          else if (port === 1883) deviceType = "IOT_GATEWAY";
          else if (targetIp.endsWith(".60") || port === 8080) deviceType = "VFD";
          else if (port === 443) deviceType = "PLC"; // Some modern PLCs use HTTPS for management

          discoveredDevices.push({
            name: `${deviceType}_${targetIp.split('.').pop()}`,
            address: targetIp,
            port: port,
            type: deviceType,
            connectionType: "ETHERNET",
            status: 'DISCONNECTED'
          });
          break; 
        } catch (e) {}
      }
    });

    await Promise.all(scanPromises);
    res.json({ devices: discoveredDevices });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
