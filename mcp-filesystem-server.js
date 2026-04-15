const { Server } = require('@modelcontextprotocol/sdk');

const server = new Server({
  name: 'filesystem',
  version: '1.0.0',
});

server.setRequestHandler('listDirectory', async (request) => {
  const fs = require('fs');
  const path = request.params.path || '.';
  const files = fs.readdirSync(path);
  return { files };
});

server.start();