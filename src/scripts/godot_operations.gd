extends SceneTree

var debug_mode = false

func _init():
    # Only run in headless mode
    if not DisplayServer.get_name() == "headless":
        print("MCP operations must run in headless mode")
        quit(1)
        return
        
    var args = OS.get_cmdline_args()
    var operation = ""
    var params_json = ""
    
    # Parse args... Godot passes script path as arg when using --script
    var script_index = -1
    for i in range(args.size()):
        if args[i] == "--script" or args[i] == "-s":
            script_index = i
            break
            
    if script_index != -1 and script_index + 2 < args.size():
        operation = args[script_index + 2]
        if script_index + 3 < args.size():
            params_json = args[script_index + 3]
            
    if operation == "":
        printerr("No operation specified")
        quit(1)
        return
        
    if params_json == "":
        printerr("No parameters specified")
        quit(1)
        return
        
    var json = JSON.new()
    var error = json.parse(params_json)
    if error != OK:
        printerr("Failed to parse parameters JSON: " + json.get_error_message())
        quit(1)
        return
        
    var params = json.data
    
    var script_dir = get_script().resource_path.get_base_dir()
    var target_script = load(script_dir + "/operations/" + operation + ".gd")
    
    if target_script:
        var instance = target_script.new()
        instance.debug_mode = debug_mode
        instance.execute(params)
        quit(0)
    else:
        printerr("Unknown operation or script not found: " + operation)
        quit(1)
