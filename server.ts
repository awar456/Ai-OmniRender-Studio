import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as apiApp } from './src/server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const server = express();

server.use(apiApp);

server.use(express.static(path.join(__dirname, 'dist')));
server.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`OmniRender AI Studio Pro running on http://0.0.0.0:${PORT}`);
});
