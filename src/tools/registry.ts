import { ListToolsRequestSchema, CallToolRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { GodotServer } from '../server.js';
import {
  handleLaunchEditor,
  handleRunProject,
  handleGetDebugOutput,
  handleStopProject,
  handleGetGodotVersion,
  handleListProjects,
  handleGetProjectInfo,
  handleCreateScene,
  handleAddNode,
  handleGenerateScript,
  handleAttachScript,
  handleLoadSprite,
  handleExportMeshLibrary,
  handleSaveScene,
  handleGetUid,
  handleUpdateProjectUids
} from './handlers.js';

export function setupToolHandlers(server: GodotServer) {
// Define available tools
server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'launch_editor',
      description: 'Launch Godot editor for a specific project',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
        },
        required: ['projectPath'],
      },
    },
    {
      name: 'run_project',
      description: 'Run the Godot project and capture output',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          scene: {
            type: 'string',
            description: 'Optional: Specific scene to run',
          },
        },
        required: ['projectPath'],
      },
    },
    {
      name: 'get_debug_output',
      description: 'Get the current debug output and errors',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'stop_project',
      description: 'Stop the currently running Godot project',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'get_godot_version',
      description: 'Get the installed Godot version',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'list_projects',
      description: 'List Godot projects in a directory',
      inputSchema: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            description: 'Directory to search for Godot projects',
          },
          recursive: {
            type: 'boolean',
            description: 'Whether to search recursively (default: false)',
          },
        },
        required: ['directory'],
      },
    },
    {
      name: 'get_project_info',
      description: 'Retrieve metadata about a Godot project',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
        },
        required: ['projectPath'],
      },
    },
    {
      name: 'create_scene',
      description: 'Create a new Godot scene file',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          scenePath: {
            type: 'string',
            description: 'Path where the scene file will be saved (relative to project)',
          },
          rootNodeType: {
            type: 'string',
            description: 'Type of the root node (e.g., Node2D, Node3D)',
          },
        },
        required: ['projectPath', 'scenePath'],
      },
    },
    {
      name: 'add_node',
      description: 'Add a node to an existing scene',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          scenePath: {
            type: 'string',
            description: 'Path to the scene file (relative to project)',
          },
          parentNodePath: {
            type: 'string',
            description: 'Path to the parent node (e.g., "root" or "root/Player")',
          },
          nodeType: {
            type: 'string',
            description: 'Type of node to add (e.g., Sprite2D, CollisionShape2D)',
          },
          nodeName: {
            type: 'string',
            description: 'Name for the new node',
          },
          properties: {
            type: 'object',
            description: 'Optional properties to set on the node',
          },
        },
        required: ['projectPath', 'scenePath', 'nodeType', 'nodeName'],
      },
    },
    {
      name: 'load_sprite',
      description: 'Load a sprite into a Sprite2D node',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          scenePath: {
            type: 'string',
            description: 'Path to the scene file (relative to project)',
          },
          nodePath: {
            type: 'string',
            description: 'Path to the Sprite2D node (e.g., "root/Player/Sprite2D")',
          },
          texturePath: {
            type: 'string',
            description: 'Path to the texture file (relative to project)',
          },
        },
        required: ['projectPath', 'scenePath', 'nodePath', 'texturePath'],
      },
    },
    {
      name: 'export_mesh_library',
      description: 'Export a scene as a MeshLibrary resource',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          scenePath: {
            type: 'string',
            description: 'Path to the scene file (.tscn) to export',
          },
          outputPath: {
            type: 'string',
            description: 'Path where the mesh library (.res) will be saved',
          },
          meshItemNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Optional: Names of specific mesh items to include (defaults to all)',
          },
        },
        required: ['projectPath', 'scenePath', 'outputPath'],
      },
    },
    {
      name: 'save_scene',
      description: 'Save changes to a scene file',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          scenePath: {
            type: 'string',
            description: 'Path to the scene file (relative to project)',
          },
          newPath: {
            type: 'string',
            description: 'Optional: New path to save the scene to (for creating variants)',
          },
        },
        required: ['projectPath', 'scenePath'],
      },
    },
    {
      name: 'get_uid',
      description: 'Get the UID for a specific file in a Godot project (for Godot 4.4+)',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          filePath: {
            type: 'string',
            description: 'Path to the file (relative to project) for which to get the UID',
          },
        },
        required: ['projectPath', 'filePath'],
      },
    },
    {
      name: 'update_project_uids',
      description: 'Update UID references in a Godot project by resaving resources (for Godot 4.4+)',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
        },
        required: ['projectPath'],
      },
    },
    {
      name: 'generate_script',
      description: 'Generate a new boilerplate GDScript file',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          scriptPath: {
            type: 'string',
            description: 'Path where the script will be saved (relative to project)',
          },
          className: {
            type: 'string',
            description: 'Optional: class_name to define in the script',
          },
          extendsNode: {
            type: 'string',
            description: 'Type of Node this script extends (default: Node)',
          },
        },
        required: ['projectPath', 'scriptPath'],
      },
    },
    {
      name: 'attach_script',
      description: 'Attach a GDScript to a Node in an existing scene',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          scenePath: {
            type: 'string',
            description: 'Path to the scene file (relative to project)',
          },
          nodePath: {
            type: 'string',
            description: 'Path to the target node (e.g., "root" or "root/Player")',
          },
          scriptPath: {
            type: 'string',
            description: 'Path to the GDScript to attach (relative to project)',
          },
        },
        required: ['projectPath', 'scenePath', 'nodePath', 'scriptPath'],
      },
    },
  ],
}));

// Handle tool calls
server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  server.logDebug(`Handling tool request: ${request.params.name}`);
  switch (request.params.name) {
    case 'launch_editor':
      return await handleLaunchEditor(server, request.params.arguments);
    case 'run_project':
      return await handleRunProject(server, request.params.arguments);
    case 'get_debug_output':
      return await handleGetDebugOutput(server, undefined);
    case 'stop_project':
      return await handleStopProject(server, undefined);
    case 'get_godot_version':
      return await handleGetGodotVersion(server, undefined);
    case 'list_projects':
      return await handleListProjects(server, request.params.arguments);
    case 'get_project_info':
      return await handleGetProjectInfo(server, request.params.arguments);
    case 'create_scene':
      return await handleCreateScene(server, request.params.arguments);
    case 'add_node':
      return await handleAddNode(server, request.params.arguments);
    case 'generate_script':
      return await handleGenerateScript(server, request.params.arguments);
    case 'attach_script':
      return await handleAttachScript(server, request.params.arguments);
    case 'load_sprite':
      return await handleLoadSprite(server, request.params.arguments);
    case 'export_mesh_library':
      return await handleExportMeshLibrary(server, request.params.arguments);
    case 'save_scene':
      return await handleSaveScene(server, request.params.arguments);
    case 'get_uid':
      return await handleGetUid(server, request.params.arguments);
    case 'update_project_uids':
      return await handleUpdateProjectUids(server, request.params.arguments);
    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
  }
});
}
