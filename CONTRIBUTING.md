# Contributing to FreightPX Godot MCP

Welcome to the **FreightPX Godot MCP** project! This project acts as the bridge between large language models and the Godot Game Engine, allowing autonomous agents to inspect, manipulate, and execute Godot projects programmatically. We are thrilled you want to contribute!

---

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful, welcoming, and inclusive environment. Harassment of any kind will not be tolerated.

---

## 🛠 Project Architecture

Before contributing, it's essential to understand how this MCP server operates:

```
freightpx-godot-mcp/
├── src/                # Node.js source code (TypeScript)
│   ├── index.ts        # Main MCP Server implementation
│   └── scripts/        # Node.js helper scripts
├── scripts/            # Godot/GDScript files
│   └── godot_operations.gd # Core headless engine manipulation logic
├── build/              # Compiled JavaScript output (ignored by git)
└── package.json        # Project configuration
```

1. **The MCP Layer (TypeScript):** Handles the Model Context Protocol communication. It registers the tools available to the AI, parses JSON arguments, and converts them to shell commands.
2. **The Godot Layer (GDScript):** When an AI requests a complex manipulation (e.g., adding a node, extracting a UID), the TypeScript server launches Godot in headless mode and executes `godot_operations.gd` with the serialized parameters.

---

## ⚙️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/freightpx/freightpx-godot-mcp.git
   cd freightpx-godot-mcp
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Compile the TypeScript code:**
   ```bash
   npm run build
   ```
4. **Develop with live reloads:**
   ```bash
   npm run watch
   ```

### Debugging the MCP Server

1. Set your `DEBUG` environment variable to `true`.
2. Ensure your `GODOT_PATH` environment variable is pointing to a valid Godot executable if the automatic fallback fails.
3. Test your tools interactively using the MCP Inspector:
   ```bash
   npm run inspector
   ```

---

## 🚀 Adding New Tools

If you are expanding the capabilities of the MCP server, you'll generally need to follow these steps:

1. **Define the Tool (`src/index.ts`):** Add the schema for your tool in `setupToolHandlers`. Ensure descriptions are highly semantic so the AI understands exactly what the tool does.
2. **Map the Parameters:** If your tool requires parameters, define them in camelCase in TypeScript and map them to snake_case for GDScript parsing (handled via `parameterMappings`).
3. **Implement GDScript Logic (`scripts/godot_operations.gd`):** Add a corresponding match block in the `execute_operation` function to process the task within the Godot Engine.
4. **Error Handling:** Ensure that GDScript errors exit cleanly with JSON output that the AI can interpret, rather than hard-crashing.

---

## 📝 Issue Templates

When opening an issue, please use the following formats to help us resolve it quickly.

### 🐛 Bug Report Template
```markdown
**Describe the bug:**
A clear and concise description of what the bug is.

**Environment details:**
- OS: [e.g. Windows 11, macOS 14]
- Godot Version: [e.g. 4.4]
- Node.js Version: [e.g. 18.17]

**Steps to Reproduce:**
1. Call tool 'X' with parameters 'Y'
2. Observe error 'Z'

**Expected behavior:**
What you expected to happen instead.
```

### ✨ Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. "I'm always frustrated when I can't ask the AI to..."

**Describe the solution you'd like:**
A clear description of the new MCP tool or capability.

**Alternative implementations:**
Describe any alternative workarounds the AI currently uses.
```

---

Thank you for contributing to FreightPX Godot MCP and helping us build a smarter Godot development ecosystem!
