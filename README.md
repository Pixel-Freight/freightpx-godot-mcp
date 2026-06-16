# FREIGHTPX GODOT MCP

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor_on_GitHub-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/freightpx) [![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/freightpx) [![Support on Ko-fi](https://img.shields.io/badge/Support_on_Ko--fi-29ABE0?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/freightpx)

[![](https://badge.mcpx.dev?type=server 'MCP Server')](https://modelcontextprotocol.io/introduction)
[![Made with Godot](https://img.shields.io/badge/Made%20with-Godot-478CBF?style=flat&logo=godot%20engine&logoColor=white)](https://godotengine.org)
[![](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white 'Node.js')](https://nodejs.org/en/download/)
[![](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white 'TypeScript')](https://www.typescriptlang.org/)

[![](https://img.shields.io/github/last-commit/freightpx/freightpx-godot-mcp 'Last Commit')](https://github.com/freightpx/freightpx-godot-mcp/commits/main)
[![](https://img.shields.io/github/stars/freightpx/freightpx-godot-mcp 'Stars')](https://github.com/freightpx/freightpx-godot-mcp/stargazers)
[![](https://img.shields.io/github/forks/freightpx/freightpx-godot-mcp 'Forks')](https://github.com/freightpx/freightpx-godot-mcp/network/members)
[![](https://img.shields.io/badge/License-MIT-red.svg 'MIT License')](https://opensource.org/licenses/MIT)

```text
  _____   _____   ______  _____  _____  _    _  _______  _____  __   __
 |  ___| |  __ \ |  ____||_   _|| ____|| |  | ||__   __||  __ \ \ \ / /
 | |__   | |__) || |__     | |  | |__  | |__| |   | |   | |__) | \ V / 
 |  __|  |  _  / |  __|    | |  |  __| |  __  |   | |   |  ___/   > <  
 | |     | | \ \ | |____  _| |_ | |____| |  | |   | |   | |      / . \ 
 |_|     |_|  \_\|______||_____||______|_|  |_|   |_|   |_|     /_/ \_\
                                                                       
                     G O D O T   M C P   S E R V E R
```

A Model Context Protocol (MCP) server designed to supercharge your AI workflows by integrating seamlessly with the Godot Game Engine.

---

## 🚀 Introduction

FreightPX Godot MCP bridges the gap between AI agents and the Godot Game Engine. It enables agents to directly launch the Godot editor, execute run projects, capture debug output, and exert programmatic control over project execution. This direct feedback loop significantly enhances an AI's ability to generate accurate, context-aware Godot code and assist with complex debugging.

## 🤖 What This MCP Can Do

This MCP server acts as an intelligent bridge between your AI assistant (like Claude or Cursor) and the Godot Game Engine. It empowers the AI to perform the following actions entirely on its own:

- **Launch & Run**: Automatically open the Godot Editor or launch the game in debug mode.
- **Inspect**: List Godot projects, read project structures, and check installed Godot versions.
- **Generate Code**: Scaffold clean GDScript boilerplate to skip mundane typing.
- **Edit Scenes**: Create new `.tscn` scene files, attach scripts to nodes, and inject new nodes into existing scenes.
- **Manage Assets**: Load textures into Sprite nodes, resave resources, and retrieve UIDs for Godot 4.4+ projects.
- **Export**: Export 3D scenes as `MeshLibrary` resources for GridMaps.

By using these tools, the AI can actively build, test, and debug your Godot game instead of just writing code snippets for you to copy and paste.

## ✨ Features

- **Launch Godot Editor**: Instantly open the Godot editor for a target project.
- **Run & Debug Projects**: Execute Godot projects in debug mode and capture console output and error messages in real-time.
- **Project Inspection**:
  - Retrieve installed Godot versions.
  - List available Godot projects within a specified directory.
  - Analyze and extract detailed structural metadata about any project.
- **Advanced Scene Management**:
  - Create new `.tscn` scenes with specific root node types.
  - Programmatically add and configure nodes to existing scenes.
  - Easily load sprites and textures into `Sprite2D` nodes.
  - Export 3D scenes as `MeshLibrary` resources (GridMap support).
- **UID Management** *(Godot 4.4+)*:
  - Retrieve the Unique ID (UID) for specific resources.
  - Update and resave resource files to refresh UID references automatically.

## 🛠 Requirements

- **Godot Engine** installed on your system (Available at [godotengine.org](https://godotengine.org/download)).
- **Node.js** (`>=18.0.0`) and `npm`.
- An **MCP-compatible AI Agent** (e.g., Claude Desktop, Cline, Cursor).

---

## ⚡ Quick Start

Setting up the server is easy. Just configure your favorite AI agent to run the MCP server executable.

### Claude Desktop / Claude Code

```bash
claude mcp add godot -- npx freightpx-godot-mcp
```
*Note: Restart Claude Code after adding the server to initialize the Godot tools.*

If your Godot executable isn't in your system PATH, supply it via environment variables:
```bash
claude mcp add godot -e GODOT_PATH=/path/to/godot -e DEBUG=true -- npx freightpx-godot-mcp
```

<details>
<summary><strong>Using with Cline</strong></summary>

Add the following to your Cline MCP settings file (`~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "godot": {
      "command": "npx",
      "args": ["freightpx-godot-mcp"],
      "env": {
        "DEBUG": "true"
      },
      "disabled": false,
      "autoApprove": [
        "launch_editor", "run_project", "get_debug_output", "stop_project",
        "get_godot_version", "list_projects", "get_project_info", "create_scene",
        "add_node", "load_sprite", "export_mesh_library", "save_scene",
        "get_uid", "update_project_uids"
      ]
    }
  }
}
```
</details>



---

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| `GODOT_PATH` | Explicit path to your Godot executable (overrides the server's automatic detection). |
| `DEBUG` | Set to `"true"` to enable detailed server-side debug logging. |

---

## 🏗 Architecture

The FreightPX Godot MCP server operates using a hybrid approach for maximum flexibility and performance:

1. **Direct Commands**: Standard Godot CLI commands handle straightforward operations like launching the editor or retrieving project metadata.
2. **Bundled GDScript Operations**: For complex, stateful tasks (e.g., scene modification, node injection), the server interfaces with a bundled GDScript (`godot_operations.gd`). This script accepts JSON-formatted parameters via command-line arguments, executing the operation headless without needing to generate temporary scripts for every task.

## 🤝 Troubleshooting

- **Godot Not Found**: Set the `GODOT_PATH` environment variable to your Godot executable path.
- **Connection Issues**: Ensure the server is running and restart your AI assistant.
- **Invalid Project Path**: Ensure the path points to a directory containing a `project.godot` file.
- **Build Issues**: Make sure all dependencies are installed by running `npm install`.


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for complete details.
