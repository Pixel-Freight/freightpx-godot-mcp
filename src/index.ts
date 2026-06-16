#!/usr/bin/env node
import { GodotServer } from './server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const args = process.argv.slice(2);
let customGodotPath: string | undefined;
let debugMode = process.env.DEBUG === 'true';
let strictPathValidation = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--godot-path' && i + 1 < args.length) {
    customGodotPath = args[i + 1];
    i++;
  } else if (args[i] === '--debug') {
    debugMode = true;
  } else if (args[i] === '--strict-path') {
    strictPathValidation = true;
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function main() {
  const config = { godotPath: customGodotPath, debugMode, strictPathValidation };
  const server = new GodotServer(config);
  const transport = new StdioServerTransport();
  await server.start(transport);
}

main().catch(error => {
  console.error('[SERVER] Fatal error starting Godot MCP server:', error);
  process.exit(1);
});
