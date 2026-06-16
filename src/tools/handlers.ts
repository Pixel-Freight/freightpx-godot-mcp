import { join, dirname, basename, normalize } from 'path';
import { existsSync, readdirSync, mkdirSync } from 'fs';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';

import type { GodotServer } from '../server.js';

const execFileAsync = promisify(execFile);

export async function handleLaunchEditor(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath) {
  return server.createErrorResponse(
    'Project path is required',
    ['Provide a valid path to a Godot project directory']
  );
}

if (!server.validatePath(args.projectPath)) {
  return server.createErrorResponse(
    'Invalid project path',
    ['Provide a valid path without ".." or other potentially unsafe characters']
  );
}

try {
  // Ensure godotPath is set
  if (!server.godotPath) {
    await server.detectGodotPath();
    if (!server.godotPath) {
      return server.createErrorResponse(
        'Could not find a valid Godot executable path',
        [
          'Ensure Godot is installed correctly',
          'Set GODOT_PATH environment variable to specify the correct path',
        ]
      );
    }
  }

  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  server.logDebug(`Launching Godot editor for project: ${args.projectPath}`);
  const process = spawn(server.godotPath, ['-e', '--path', args.projectPath], {
    stdio: 'pipe',
  });

  process.on('error', (err: Error) => {
    console.error('Failed to start Godot editor:', err);
  });

  return {
    content: [
      {
        type: 'text',
        text: `Godot editor launched successfully for project at ${args.projectPath}.`,
      },
    ],
  };
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return server.createErrorResponse(
    `Failed to launch Godot editor: ${errorMessage}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleRunProject(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath) {
  return server.createErrorResponse(
    'Project path is required',
    ['Provide a valid path to a Godot project directory']
  );
}

if (!server.validatePath(args.projectPath)) {
  return server.createErrorResponse(
    'Invalid project path',
    ['Provide a valid path without ".." or other potentially unsafe characters']
  );
}

try {
  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  // Kill any existing process
  if (server.activeProcess) {
    server.logDebug('Killing existing Godot process before starting a new one');
    server.activeProcess.process.kill();
  }

  const cmdArgs = ['-d', '--path', args.projectPath];
  if (args.scene && server.validatePath(args.scene)) {
    server.logDebug(`Adding scene parameter: ${args.scene}`);
    cmdArgs.push(args.scene);
  }

  server.logDebug(`Running Godot project: ${args.projectPath}`);
  const process = spawn(server.godotPath!, cmdArgs, { stdio: 'pipe' });
  const output: string[] = [];
  const errors: string[] = [];

  process.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    output.push(...lines);
    lines.forEach((line: string) => {
      if (line.trim()) server.logDebug(`[Godot stdout] ${line}`);
    });
  });

  process.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    errors.push(...lines);
    lines.forEach((line: string) => {
      if (line.trim()) server.logDebug(`[Godot stderr] ${line}`);
    });
  });

  process.on('exit', (code: number | null) => {
    server.logDebug(`Godot process exited with code ${code}`);
    if (server.activeProcess && server.activeProcess.process === process) {
      server.activeProcess = null;
    }
  });

  process.on('error', (err: Error) => {
    console.error('Failed to start Godot process:', err);
    if (server.activeProcess && server.activeProcess.process === process) {
      server.activeProcess = null;
    }
  });

  server.activeProcess = { process, output, errors };

  return {
    content: [
      {
        type: 'text',
        text: `Godot project started in debug mode. Use get_debug_output to see output.`,
      },
    ],
  };
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return server.createErrorResponse(
    `Failed to run Godot project: ${errorMessage}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleGetDebugOutput(server: GodotServer, args: any) {
if (!server.activeProcess) {
  return server.createErrorResponse(
    'No active Godot process.',
    [
      'Use run_project to start a Godot project first',
      'Check if the Godot process crashed unexpectedly',
    ]
  );
}

return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(
        {
          output: server.activeProcess.output,
          errors: server.activeProcess.errors,
        },
        null,
        2
      ),
    },
  ],
};
}

export async function handleStopProject(server: GodotServer, args: any) {
if (!server.activeProcess) {
  return server.createErrorResponse(
    'No active Godot process to stop.',
    [
      'Use run_project to start a Godot project first',
      'The process may have already terminated',
    ]
  );
}

server.logDebug('Stopping active Godot process');
server.activeProcess.process.kill();
const output = server.activeProcess.output;
const errors = server.activeProcess.errors;
server.activeProcess = null;

return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(
        {
          message: 'Godot project stopped',
          finalOutput: output,
          finalErrors: errors,
        },
        null,
        2
      ),
    },
  ],
};
}

export async function handleGetGodotVersion(server: GodotServer, args: any) {
try {
  // Ensure godotPath is set
  if (!server.godotPath) {
    await server.detectGodotPath();
    if (!server.godotPath) {
      return server.createErrorResponse(
        'Could not find a valid Godot executable path',
        [
          'Ensure Godot is installed correctly',
          'Set GODOT_PATH environment variable to specify the correct path',
        ]
      );
    }
  }

  server.logDebug('Getting Godot version');
  const { stdout } = await execFileAsync(server.godotPath!, ['--version']);
  return {
    content: [
      {
        type: 'text',
        text: stdout.trim(),
      },
    ],
  };
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return server.createErrorResponse(
    `Failed to get Godot version: ${errorMessage}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
    ]
  );
}
}

export async function handleListProjects(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.directory) {
  return server.createErrorResponse(
    'Directory is required',
    ['Provide a valid directory path to search for Godot projects']
  );
}

if (!server.validatePath(args.directory)) {
  return server.createErrorResponse(
    'Invalid directory path',
    ['Provide a valid path without ".." or other potentially unsafe characters']
  );
}

try {
  server.logDebug(`Listing Godot projects in directory: ${args.directory}`);
  if (!existsSync(args.directory)) {
    return server.createErrorResponse(
      `Directory does not exist: ${args.directory}`,
      ['Provide a valid directory path that exists on the system']
    );
  }

  const recursive = args.recursive === true;
  const projects = server.findGodotProjects(args.directory, recursive);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(projects, null, 2),
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to list projects: ${error?.message || 'Unknown error'}`,
    [
      'Ensure the directory exists and is accessible',
      'Check if you have permission to read the directory',
    ]
  );
}
}

export async function handleGetProjectInfo(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath) {
  return server.createErrorResponse(
    'Project path is required',
    ['Provide a valid path to a Godot project directory']
  );
}

if (!server.validatePath(args.projectPath)) {
  return server.createErrorResponse(
    'Invalid project path',
    ['Provide a valid path without ".." or other potentially unsafe characters']
  );
}

try {
  // Ensure godotPath is set
  if (!server.godotPath) {
    await server.detectGodotPath();
    if (!server.godotPath) {
      return server.createErrorResponse(
        'Could not find a valid Godot executable path',
        [
          'Ensure Godot is installed correctly',
          'Set GODOT_PATH environment variable to specify the correct path',
        ]
      );
    }
  }

  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  server.logDebug(`Getting project info for: ${args.projectPath}`);

  // Get Godot version
  const execOptions = { timeout: 10000 }; // 10 second timeout
  const { stdout } = await execFileAsync(server.godotPath!, ['--version'], execOptions);

  // Get project structure using the recursive method
  const projectStructure = await server.getProjectStructureAsync(args.projectPath);

  // Extract project name from project.godot file
  let projectName = basename(args.projectPath);
  try {
    const fs = require('fs');
    const projectFileContent = fs.readFileSync(projectFile, 'utf8');
    const configNameMatch = projectFileContent.match(/config\/name="([^"]+)"/);
    if (configNameMatch && configNameMatch[1]) {
      projectName = configNameMatch[1];
      server.logDebug(`Found project name in config: ${projectName}`);
    }
  } catch (error) {
    server.logDebug(`Error reading project file: ${error}`);
    // Continue with default project name if extraction fails
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            name: projectName,
            path: args.projectPath,
            godotVersion: stdout.trim(),
            structure: projectStructure,
          },
          null,
          2
        ),
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to get project info: ${error?.message || 'Unknown error'}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleCreateScene(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath || !args.scenePath) {
  return server.createErrorResponse(
    'Project path and scene path are required',
    ['Provide valid paths for both the project and the scene']
  );
}

if (!server.validatePath(args.projectPath) || !server.validatePath(args.scenePath)) {
  return server.createErrorResponse(
    'Invalid path',
    ['Provide valid paths without ".." or other potentially unsafe characters']
  );
}

const rootNodeType = args.rootNodeType || 'Node2D';
if (!server.validateClassName(rootNodeType)) {
  return server.createErrorResponse(
    'Invalid rootNodeType',
    ['rootNodeType must be a built-in Godot class name (no paths, no file extensions)']
  );
}

try {
  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  // Prepare parameters for the operation (already in camelCase)
  const params = {
    scenePath: args.scenePath,
    rootNodeType,
  };

  // Execute the operation
  const { stdout, stderr } = await server.executeOperation('create_scene', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    return server.createErrorResponse(
      `Failed to create scene: ${stderr}`,
      [
        'Check if the root node type is valid',
        'Ensure you have write permissions to the scene path',
        'Verify the scene path is valid',
      ]
    );
  }

  return {
    content: [
      {
        type: 'text',
        text: `Scene created successfully at: ${args.scenePath}\n\nOutput: ${stdout}`,
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to create scene: ${error?.message || 'Unknown error'}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleAddNode(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath || !args.scenePath || !args.nodeType || !args.nodeName) {
  return server.createErrorResponse(
    'Missing required parameters',
    ['Provide projectPath, scenePath, nodeType, and nodeName']
  );
}

if (!server.validatePath(args.projectPath) || !server.validatePath(args.scenePath)) {
  return server.createErrorResponse(
    'Invalid path',
    ['Provide valid paths without ".." or other potentially unsafe characters']
  );
}

if (!server.validateClassName(args.nodeType)) {
  return server.createErrorResponse(
    'Invalid nodeType',
    ['nodeType must be a built-in Godot class name (no paths, no file extensions)']
  );
}

try {
  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  // Check if the scene file exists
  const scenePath = join(args.projectPath, args.scenePath);
  if (!existsSync(scenePath)) {
    return server.createErrorResponse(
      `Scene file does not exist: ${args.scenePath}`,
      [
        'Ensure the scene path is correct',
        'Use create_scene to create a new scene first',
      ]
    );
  }

  // Prepare parameters for the operation (already in camelCase)
  const params: any = {
    scenePath: args.scenePath,
    nodeType: args.nodeType,
    nodeName: args.nodeName,
  };

  // Add optional parameters
  if (args.parentNodePath) {
    params.parentNodePath = args.parentNodePath;
  }

  if (args.properties) {
    params.properties = args.properties;
  }

  // Execute the operation
  const { stdout, stderr } = await server.executeOperation('add_node', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    return server.createErrorResponse(
      `Failed to add node: ${stderr}`,
      [
        'Check if the node type is valid',
        'Ensure the parent node path exists',
        'Verify the scene file is valid',
      ]
    );
  }

  return {
    content: [
      {
        type: 'text',
        text: `Node '${args.nodeName}' of type '${args.nodeType}' added successfully to '${args.scenePath}'.\n\nOutput: ${stdout}`,
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to add node: ${error?.message || 'Unknown error'}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleGenerateScript(server: GodotServer, args: any) {
args = server.normalizeParameters(args);
    const { projectPath, scriptPath, className, extendsNode = 'Node' } = args;

    if (!projectPath || !scriptPath) {
      return server.createErrorResponse('Missing required arguments', ['Provide projectPath and scriptPath']);
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      const fullPath = path.join(projectPath, scriptPath.replace(/^res:\/\//, ''));
      
      const scriptContent = `${className ? `class_name ${className}\n` : ''}extends ${extendsNode}

# Called when the node enters the scene tree for the first time.
func _ready():
\tpass # Replace with function body.

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
\tpass
`;
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, scriptContent, 'utf-8');
      
      return {
        content: [{ type: 'text', text: `Script successfully generated at ${scriptPath}` }],
      };
    } catch (error: any) {
      return server.createErrorResponse(`Failed to generate script: ${error.message}`);
    }
}

export async function handleAttachScript(server: GodotServer, args: any) {
args = server.normalizeParameters(args);
if (!args.projectPath || !args.scenePath || !args.nodePath || !args.scriptPath) {
  return server.createErrorResponse('Missing required arguments', ['Provide projectPath, scenePath, nodePath, and scriptPath']);
}

try {
  const { stdout, stderr } = await server.executeOperation('attach_script', args, args.projectPath);
  if (stderr && stderr.includes('Failed to')) {
    return server.createErrorResponse(`Failed to attach script: ${stderr}`);
  }
  return {
    content: [
      {
        type: 'text',
        text: `Script '${args.scriptPath}' attached successfully to node '${args.nodePath}'.\n\nOutput: ${stdout}`,
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(`Execution failed: ${error.message}`);
}
}

export async function handleLoadSprite(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath || !args.scenePath || !args.nodePath || !args.texturePath) {
  return server.createErrorResponse(
    'Missing required parameters',
    ['Provide projectPath, scenePath, nodePath, and texturePath']
  );
}

if (
  !server.validatePath(args.projectPath) ||
  !server.validatePath(args.scenePath) ||
  !server.validatePath(args.nodePath) ||
  !server.validatePath(args.texturePath)
) {
  return server.createErrorResponse(
    'Invalid path',
    ['Provide valid paths without ".." or other potentially unsafe characters']
  );
}

try {
  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  // Check if the scene file exists
  const scenePath = join(args.projectPath, args.scenePath);
  if (!existsSync(scenePath)) {
    return server.createErrorResponse(
      `Scene file does not exist: ${args.scenePath}`,
      [
        'Ensure the scene path is correct',
        'Use create_scene to create a new scene first',
      ]
    );
  }

  // Check if the texture file exists
  const texturePath = join(args.projectPath, args.texturePath);
  if (!existsSync(texturePath)) {
    return server.createErrorResponse(
      `Texture file does not exist: ${args.texturePath}`,
      [
        'Ensure the texture path is correct',
        'Upload or create the texture file first',
      ]
    );
  }

  // Prepare parameters for the operation (already in camelCase)
  const params = {
    scenePath: args.scenePath,
    nodePath: args.nodePath,
    texturePath: args.texturePath,
  };

  // Execute the operation
  const { stdout, stderr } = await server.executeOperation('load_sprite', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    return server.createErrorResponse(
      `Failed to load sprite: ${stderr}`,
      [
        'Check if the node path is correct',
        'Ensure the node is a Sprite2D, Sprite3D, or TextureRect',
        'Verify the texture file is a valid image format',
      ]
    );
  }

  return {
    content: [
      {
        type: 'text',
        text: `Sprite loaded successfully with texture: ${args.texturePath}\n\nOutput: ${stdout}`,
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to load sprite: ${error?.message || 'Unknown error'}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleExportMeshLibrary(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath || !args.scenePath || !args.outputPath) {
  return server.createErrorResponse(
    'Missing required parameters',
    ['Provide projectPath, scenePath, and outputPath']
  );
}

if (
  !server.validatePath(args.projectPath) ||
  !server.validatePath(args.scenePath) ||
  !server.validatePath(args.outputPath)
) {
  return server.createErrorResponse(
    'Invalid path',
    ['Provide valid paths without ".." or other potentially unsafe characters']
  );
}

try {
  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  // Check if the scene file exists
  const scenePath = join(args.projectPath, args.scenePath);
  if (!existsSync(scenePath)) {
    return server.createErrorResponse(
      `Scene file does not exist: ${args.scenePath}`,
      [
        'Ensure the scene path is correct',
        'Use create_scene to create a new scene first',
      ]
    );
  }

  // Prepare parameters for the operation (already in camelCase)
  const params: any = {
    scenePath: args.scenePath,
    outputPath: args.outputPath,
  };

  // Add optional parameters
  if (args.meshItemNames && Array.isArray(args.meshItemNames)) {
    params.meshItemNames = args.meshItemNames;
  }

  // Execute the operation
  const { stdout, stderr } = await server.executeOperation('export_mesh_library', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    return server.createErrorResponse(
      `Failed to export mesh library: ${stderr}`,
      [
        'Check if the scene contains valid 3D meshes',
        'Ensure the output path is valid',
        'Verify the scene file is valid',
      ]
    );
  }

  return {
    content: [
      {
        type: 'text',
        text: `MeshLibrary exported successfully to: ${args.outputPath}\n\nOutput: ${stdout}`,
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to export mesh library: ${error?.message || 'Unknown error'}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleSaveScene(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath || !args.scenePath) {
  return server.createErrorResponse(
    'Missing required parameters',
    ['Provide projectPath and scenePath']
  );
}

if (!server.validatePath(args.projectPath) || !server.validatePath(args.scenePath)) {
  return server.createErrorResponse(
    'Invalid path',
    ['Provide valid paths without ".." or other potentially unsafe characters']
  );
}

// If newPath is provided, validate it
if (args.newPath && !server.validatePath(args.newPath)) {
  return server.createErrorResponse(
    'Invalid new path',
    ['Provide a valid new path without ".." or other potentially unsafe characters']
  );
}

try {
  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  // Check if the scene file exists
  const scenePath = join(args.projectPath, args.scenePath);
  if (!existsSync(scenePath)) {
    return server.createErrorResponse(
      `Scene file does not exist: ${args.scenePath}`,
      [
        'Ensure the scene path is correct',
        'Use create_scene to create a new scene first',
      ]
    );
  }

  // Prepare parameters for the operation (already in camelCase)
  const params: any = {
    scenePath: args.scenePath,
  };

  // Add optional parameters
  if (args.newPath) {
    params.newPath = args.newPath;
  }

  // Execute the operation
  const { stdout, stderr } = await server.executeOperation('save_scene', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    return server.createErrorResponse(
      `Failed to save scene: ${stderr}`,
      [
        'Check if the scene file is valid',
        'Ensure you have write permissions to the output path',
        'Verify the scene can be properly packed',
      ]
    );
  }

  const savePath = args.newPath || args.scenePath;
  return {
    content: [
      {
        type: 'text',
        text: `Scene saved successfully to: ${savePath}\n\nOutput: ${stdout}`,
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to save scene: ${error?.message || 'Unknown error'}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleGetUid(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath || !args.filePath) {
  return server.createErrorResponse(
    'Missing required parameters',
    ['Provide projectPath and filePath']
  );
}

if (!server.validatePath(args.projectPath) || !server.validatePath(args.filePath)) {
  return server.createErrorResponse(
    'Invalid path',
    ['Provide valid paths without ".." or other potentially unsafe characters']
  );
}

try {
  // Ensure godotPath is set
  if (!server.godotPath) {
    await server.detectGodotPath();
    if (!server.godotPath) {
      return server.createErrorResponse(
        'Could not find a valid Godot executable path',
        [
          'Ensure Godot is installed correctly',
          'Set GODOT_PATH environment variable to specify the correct path',
        ]
      );
    }
  }

  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  // Check if the file exists
  const filePath = join(args.projectPath, args.filePath);
  if (!existsSync(filePath)) {
    return server.createErrorResponse(
      `File does not exist: ${args.filePath}`,
      ['Ensure the file path is correct']
    );
  }

  // Get Godot version to check if UIDs are supported
  const { stdout: versionOutput } = await execFileAsync(server.godotPath!, ['--version']);
  const version = versionOutput.trim();

  if (!server.isGodot44OrLater(version)) {
    return server.createErrorResponse(
      `UIDs are only supported in Godot 4.4 or later. Current version: ${version}`,
      [
        'Upgrade to Godot 4.4 or later to use UIDs',
        'Use resource paths instead of UIDs for this version of Godot',
      ]
    );
  }

  // Prepare parameters for the operation (already in camelCase)
  const params = {
    filePath: args.filePath,
  };

  // Execute the operation
  const { stdout, stderr } = await server.executeOperation('get_uid', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    return server.createErrorResponse(
      `Failed to get UID: ${stderr}`,
      [
        'Check if the file is a valid Godot resource',
        'Ensure the file path is correct',
      ]
    );
  }

  return {
    content: [
      {
        type: 'text',
        text: `UID for ${args.filePath}: ${stdout.trim()}`,
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to get UID: ${error?.message || 'Unknown error'}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

export async function handleUpdateProjectUids(server: GodotServer, args: any) {
// Normalize parameters to camelCase
args = server.normalizeParameters(args);

if (!args.projectPath) {
  return server.createErrorResponse(
    'Project path is required',
    ['Provide a valid path to a Godot project directory']
  );
}

if (!server.validatePath(args.projectPath)) {
  return server.createErrorResponse(
    'Invalid project path',
    ['Provide a valid path without ".." or other potentially unsafe characters']
  );
}

try {
  // Ensure godotPath is set
  if (!server.godotPath) {
    await server.detectGodotPath();
    if (!server.godotPath) {
      return server.createErrorResponse(
        'Could not find a valid Godot executable path',
        [
          'Ensure Godot is installed correctly',
          'Set GODOT_PATH environment variable to specify the correct path',
        ]
      );
    }
  }

  // Check if the project directory exists and contains a project.godot file
  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    return server.createErrorResponse(
      `Not a valid Godot project: ${args.projectPath}`,
      [
        'Ensure the path points to a directory containing a project.godot file',
        'Use list_projects to find valid Godot projects',
      ]
    );
  }

  // Get Godot version to check if UIDs are supported
  const { stdout: versionOutput } = await execFileAsync(server.godotPath!, ['--version']);
  const version = versionOutput.trim();

  if (!server.isGodot44OrLater(version)) {
    return server.createErrorResponse(
      `UIDs are only supported in Godot 4.4 or later. Current version: ${version}`,
      [
        'Upgrade to Godot 4.4 or later to use UIDs',
        'Use resource paths instead of UIDs for this version of Godot',
      ]
    );
  }

  // Prepare parameters for the operation (already in camelCase)
  const params = {
    projectPath: args.projectPath,
  };

  // Execute the operation
  const { stdout, stderr } = await server.executeOperation('resave_resources', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    return server.createErrorResponse(
      `Failed to update project UIDs: ${stderr}`,
      [
        'Check if the project is valid',
        'Ensure you have write permissions to the project directory',
      ]
    );
  }

  return {
    content: [
      {
        type: 'text',
        text: `Project UIDs updated successfully.\n\nOutput: ${stdout}`,
      },
    ],
  };
} catch (error: any) {
  return server.createErrorResponse(
    `Failed to update project UIDs: ${error?.message || 'Unknown error'}`,
    [
      'Ensure Godot is installed correctly',
      'Check if the GODOT_PATH environment variable is set correctly',
      'Verify the project path is accessible',
    ]
  );
}
}

