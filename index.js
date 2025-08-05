// Enhanced CLI with intelligent AI file system integration

const readline = require("readline");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const COHORA_BANNER = [
  "  ██████╗ ██████╗ ██╗  ██╗ ██████╗ ██████╗  █████╗      ██████╗██╗     ██╗",
  " ██╔════╝██╔═══██╗██║  ██║██╔═══██╗██╔══██╗██╔══██╗    ██╔════╝██║     ██║",
  " ██║     ██║   ██║███████║██║   ██║██████╔╝███████║    ██║     ██║     ██║",
  " ██║     ██║   ██║██╔══██║██║   ██║██╔══██╗██╔══██║    ██║     ██║     ██║",
  " ╚██████╗╚██████╔╝██║  ██║╚██████╔╝██║  ██║██║  ██║    ╚██████╗███████╗██║",
  "  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝╚══════╝╚═╝"
];

const aiProviders = {
  claude: {
    name: "Claude (Anthropic)",
    color: colors.red + colors.bright,
    status: "connected",
    send: async (message) => {
      const axios = require("axios");
      const apiKey = process.env.CLAUDE_API_KEY;

      try {
        const res = await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model: "claude-3-opus-20240229",
            max_tokens: 4000,
            messages: [{ role: "user", content: message }],
          },
          {
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
          }
        );

        return res.data.content[0].text;
      } catch (err) {
        return `Claude API error: ${
          err.response?.data?.error?.message || err.message
        }`;
      }
    },
  },
  grok: {
    name: "Grok (xAI)",
    color: colors.cyan,
    status: "connected",
    send: async (message) => {
      const axios = require("axios");
      const apiKey = process.env.GROK_API_KEY;

      try {
        const res = await axios.post(
          "https://api.x.ai/v1/chat/completions",
          {
            model: "grok-3-latest",
            stream: false,
            temperature: 0.7,
            max_tokens: 4000,
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: message },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        return (
          res.data.choices?.[0]?.message?.content?.trim() ||
          "Empty response from Grok."
        );
      } catch (err) {
        return `Grok API error: ${
          err.response?.data?.error?.message || err.message
        }`;
      }
    },
  },
};

const providerBanners = {
  claude: [
    "███████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗",
    "██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝",
    "██║     ██║     ███████║██║   ██║██║  ██║█████╗  ",
    "██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  ",
    "╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗",
    " ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝"
  ],

  grok: [
    " ██████╗ ██████╗  ██████╗ ██╗  ██╗",
    "██╔════╝ ██╔══██╗██╔═══██╗██║ ██╔╝",
    "██║  ███╗██████╔╝██║   ██║█████╔╝ ",
    "██║   ██║██╔══██╗██║   ██║██╔═██╗ ",
    "╚██████╔╝██║  ██║╚██████╔╝██║  ██╗",
    " ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝"
  ]
};

class CohoraAiCli {
  constructor() {
    this.currentProvider = null;
    this.currentDirectory = process.cwd();
    this.userName = "user"; // Default user name
    this.fileContext = new Map(); // Store file contents for context
    this.detectedActions = []; // Store detected file actions
    this.conversationHistory = []; // Store conversation history for context
    this.pendingAction = null; // Store pending actions (like file deletion confirmation)
    this.codebaseContext = new Map(); // Store codebase analysis and structure
    this.refactoringHistory = []; // Track refactoring changes
    this.automationTasks = new Map(); // Store automation scripts
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.setupReadline();
    this.checklist = [];
  }

  setupReadline() {
    this.rl.on("line", (input) => this.handleCommand(input.trim()));
    this.rl.on("close", () => this.exitCLI());
    process.on("SIGINT", () => this.exitCLI());
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  clearScreen() {
    console.clear();
  }

  async showIntro() {
    this.clearScreen();
    if (!this.bannerShown) {
      // Display COHORA-CLI banner in blue
      for (let i = 0; i < COHORA_BANNER.length; i++) {
        const line = COHORA_BANNER[i];
        console.log(`${colors.blue}${colors.bright}${line}${colors.reset}`);
      }
      
      console.log(`\n${colors.cyan}${colors.bright}         Welcome to COHORA AI CLI Assistant${colors.reset}`);
      this.bannerShown = true;
    }
    
    // Note: Use /name <your-name> to set your custom name
    
    this.log("\nInitializing modules...", colors.dim);
    await new Promise((res) => setTimeout(res, 1000));
    this.log("AI Engines warming up...", colors.dim);
    await new Promise((res) => setTimeout(res, 1000));
    this.log("File system integration active...", colors.dim);
    await new Promise((res) => setTimeout(res, 500));
    this.log("Intelligent file operations enabled...", colors.dim);
    await new Promise((res) => setTimeout(res, 500));
    this.log(`
${colors.bright}COHORA AI CLI Agent is now up and running!${colors.reset}`);
    this.log(`Use ${colors.cyan}/list${colors.reset} to view available AI engines.`);
    this.log(`Use ${colors.cyan}/switch <provider>${colors.reset} to activate one.`);
    this.log(`Use ${colors.cyan}/files${colors.reset} to explore local files.`);
    this.log(`${colors.bright}AGENT MODE:${colors.reset} Try natural commands like "create readme file"!`);
    this.log(`Type ${colors.cyan}/help${colors.reset} to explore all commands.
`, colors.green);
  }

  async simulateTyping(text, delay = 25) {
    for (let char of text) {
      process.stdout.write(char);
      await new Promise((res) => setTimeout(res, delay));
    }
    console.log();
  }

  async handleCommand(input) {
    if (!input) return this.setPrompt();
    if (input.startsWith("/")) return this.handleSlashCommand(input);
    if (!this.currentProvider) {
      this.log("No provider selected. Use /switch <name>.", colors.red);
      return this.setPrompt();
    }
    
    // Handle pending actions (like file deletion confirmations)
    if (this.pendingAction) {
      await this.handlePendingAction(input);
      return this.setPrompt();
    }
    
    await this.sendToAi(input);
    this.setPrompt();
  }

  async handleSlashCommand(input) {
    const [cmd, ...args] = input.slice(1).split(" ");
    switch (cmd.toLowerCase()) {
      case "switch":
        return this.switchProvider(args[0]);
      case "list":
        return this.listProviders();
      case "status":
        return this.showStatus();
      case "clear":
        return this.showIntro();
      case "help":
        return this.showHelp();
      case "exit":
        return this.exitCLI();
      case "current":
        return this.currentProvider
          ? this.log(`Current provider: ${this.currentProvider}`)
          : this.log("No provider selected.", colors.red);
      case "reset":
        this.currentProvider = null;
        return this.log("Reset current AI provider. Use /switch to choose again.", colors.yellow);
      case "clear-history":
        this.conversationHistory = [];
        this.pendingAction = null;
        return this.log("Conversation history and pending actions cleared.", colors.green);
      case "name":
        if (args.length > 0) {
          this.userName = args[0];
          this.log(`User name set to: ${colors.cyan}${this.userName}${colors.reset}`, colors.green);
        } else {
          this.log(`Current user name: ${colors.cyan}${this.userName}${colors.reset}`, colors.yellow);
          this.log(`Use /name <your-name> to change it`, colors.dim);
        }
        return;
      
      // Advanced codebase features
      case "analyze":
        return this.analyzeCodebase(args[0]);
      case "refactor":
        return this.refactorCode(args[0], args.slice(1).join(" "));
      case "debug":
        return this.debugCode(args[0]);
      case "generate":
        return this.generateCode(args[0], args.slice(1).join(" "));
      case "automate":
        return this.createAutomation(args[0], args.slice(1).join(" "));
      case "search":
        return this.searchCodebase(args[0]);
      case "deps":
        return this.analyzeDependencies();
      case "structure":
        return this.showCodebaseStructure();
      case "test-write":
        return this.testWriteFile(args[0], args.slice(1).join(" "));
      

      
      // File system commands
      case "files":
        return this.listFiles(args[0]);
      case "pwd":
        return this.showCurrentDirectory();
      case "cd":
        return this.changeDirectory(args[0]);
      case "read":
        return this.readFile(args[0]);
      case "write":
        return this.writeFile(args[0], args.slice(1).join(" "));
      case "create":
        return this.createFile(args[0]);
      case "delete":
        return this.deleteFile(args[0]);
      case "mkdir":
        return this.createDirectory(args[0]);
      
      case "todo":
        return this.displayChecklist();
      
      default:
        return this.log(`Unknown command: /${cmd}`, colors.red);
    }
  }

  async switchProvider(key) {
    if (!aiProviders[key])
      return this.log(`Unknown provider: ${key}`, colors.red);
    this.currentProvider = key;
    await this.showBanner(key);
    this.log(
      `Switched to ${aiProviders[key].color}${aiProviders[key].name}${colors.reset}`,
      colors.green
    );
  }

  listProviders() {
    this.log("\nProviders:", colors.yellow);
    for (const [key, p] of Object.entries(aiProviders)) {
      const isCurrent = key === this.currentProvider;
      this.log(
        `  ${isCurrent ? ">" : " "} ${key.padEnd(10)} - ${p.color}${p.name}${colors.reset}`
      );
    }
    console.log();
  }

  showStatus() {
    if (!this.currentProvider) return this.log("No provider selected.", colors.red);
    const p = aiProviders[this.currentProvider];
    this.log(
      `\nCurrent: ${p.color}${p.name}${colors.reset} (${this.currentProvider}) - ${p.status}`
    );
    this.log(`Directory: ${this.currentDirectory}`, colors.dim);
    this.log(`Files in context: ${this.fileContext.size}`, colors.dim);
    console.log();
  }

  showHelp() {
    this.log("\n💡 Commands:", colors.yellow);
    this.log("  ${colors.cyan}AI Commands:${colors.reset}");
    this.log("  /switch <provider>   Change current AI model");
    this.log("  /list                Show available providers");
    this.log("  /status              Show current model info");
    this.log("  /current             Show selected provider");
    this.log("  /reset               Unselect provider");
    this.log("  /clear-history       Clear conversation history");
    this.log("  /name [new-name]     Set or show current user name");
    this.log("\n  ${colors.cyan}Advanced Codebase Features:${colors.reset}");
    this.log("  /analyze [path]      Analyze codebase structure and metrics");
    this.log("  /search <query>      Search codebase for specific terms");
    this.log("  /structure           Show codebase directory structure");
    this.log("  /deps                Analyze project dependencies");
    this.log("  /refactor <file>     Refactor code with AI assistance");
    this.log("  /debug <file>        Debug and fix code issues");
    this.log("  /generate <type>     Generate code (component, api, test, etc.)");
    this.log("  /automate <name>     Create automation scripts");
    this.log("\n  ${colors.cyan}File System Commands:${colors.reset}");
    this.log("  /files [dir]         List files in directory");
    this.log("  /pwd                 Show current directory");
    this.log("  /cd <dir>            Change directory");
    this.log("  /read <file>         Read file content");
    this.log("  /write <file> <text> Write text to file");
    this.log("  /create <file>       Create new file");
    this.log("  /delete <file>       Delete file");
    this.log("  /mkdir <dir>         Create directory");
    this.log("\n  ${colors.cyan}Agent Mode - Smart File Operations:${colors.reset}");
    this.log("  AI automatically detects file operations from natural language");
    this.log("  AI can create, edit, and update files based on instructions");
    this.log("  Examples:");
    this.log("    'create readme file' → Creates README.md");
    this.log("    'create package.json' → Creates package.json");
    this.log("    'make server.js' → Creates server.js");
    this.log("    'update index.js with new features' → Edits index.js");
    this.log("    'delete oldfile.txt' → Deletes file");
    this.log("\n  ${colors.cyan}General Commands:${colors.reset}");
    this.log("  /clear               Clear screen + show banner");
    this.log("  /help                Show help message");
    this.log("  /exit                Exit terminal");
    console.log();
  }

  // File System Methods
  async listFiles(dirPath = null) {
    try {
      const targetDir = dirPath ? path.resolve(this.currentDirectory, dirPath) : this.currentDirectory;
      const files = await fs.readdir(targetDir, { withFileTypes: true });
      
      this.log(`\nFiles in ${targetDir}:`, colors.yellow);
      
      for (const file of files) {
        const icon = file.isDirectory() ? "[DIR]" : "[FILE]";
        const color = file.isDirectory() ? colors.blue : colors.white;
        this.log(`  ${icon} ${color}${file.name}${colors.reset}`);
      }
      console.log();
    } catch (error) {
      this.log(`Error listing files: ${error.message}`, colors.red);
    }
  }

  showCurrentDirectory() {
    this.log(`Current directory: ${colors.cyan}${this.currentDirectory}${colors.reset}`);
  }

  async changeDirectory(dirPath) {
    if (!dirPath) {
      return this.log("Please specify a directory path.", colors.red);
    }
    
    try {
      const newPath = path.resolve(this.currentDirectory, dirPath);
      await fs.access(newPath);
      const stats = await fs.stat(newPath);
      
      if (!stats.isDirectory()) {
        return this.log("Path is not a directory.", colors.red);
      }
      
      this.currentDirectory = newPath;
      this.log(`Changed directory to: ${colors.cyan}${this.currentDirectory}${colors.reset}`);
    } catch (error) {
      this.log(`Error changing directory: ${error.message}`, colors.red);
    }
  }

  async readFile(filename) {
    if (!filename) {
      return this.log("Please specify a filename.", colors.red);
    }
    
    try {
      const filePath = path.resolve(this.currentDirectory, filename);
      const content = await fs.readFile(filePath, 'utf8');
      
      this.log(`\nContent of ${colors.cyan}${filename}${colors.reset}:`, colors.yellow);
      this.log("─".repeat(50), colors.dim);
      console.log(content);
      this.log("─".repeat(50), colors.dim);
      
      // Store in context for AI use
      this.fileContext.set(filename, content);
      
    } catch (error) {
      this.log(`Error reading file: ${error.message}`, colors.red);
    }
  }

  async writeFile(filename, content, silent = false) {
    if (!filename) {
      if (!silent) this.log("Please specify a filename.", colors.red);
      return false;
    }
    
    if (!content) {
      if (!silent) this.log("Please specify content to write.", colors.red);
      return false;
    }
    
    try {
      const filePath = path.resolve(this.currentDirectory, filename);
      await fs.writeFile(filePath, content, 'utf8');
      if (!silent) {
        this.log(`Successfully wrote to ${colors.cyan}${filename}${colors.reset}`, colors.green);
      }
      
      // Update context
      this.fileContext.set(filename, content);
      return true;
      
    } catch (error) {
      if (!silent) {
        this.log(`Error writing file: ${error.message}`, colors.red);
      }
      return false;
    }
  }

  async createFile(filename) {
    if (!filename) {
      return this.log("Please specify a filename.", colors.red);
    }
    
    try {
      const filePath = path.resolve(this.currentDirectory, filename);
      await fs.writeFile(filePath, "", 'utf8');
      this.log(`Created file ${colors.cyan}${filename}${colors.reset}`, colors.green);
    } catch (error) {
      this.log(`Error creating file: ${error.message}`, colors.red);
    }
  }

  async deleteFile(filename) {
    if (!filename) {
      return this.log("Please specify a filename.", colors.red);
    }
    
    try {
      const filePath = path.resolve(this.currentDirectory, filename);
      await fs.unlink(filePath);
      this.log(`Deleted file ${colors.cyan}${filename}${colors.reset}`, colors.green);
      this.fileContext.delete(filename);
    } catch (error) {
      this.log(`Error deleting file: ${error.message}`, colors.red);
    }
  }

  async handlePendingAction(input) {
    const action = this.pendingAction;
    
    if (action.type === 'delete_confirmation') {
      const response = input.toLowerCase().trim();
      
      if (response === 'yes' || response === 'y' || response === 'confirm') {
        try {
          // Check if file exists first
          const filePath = path.resolve(this.currentDirectory, action.filename);
          await fs.access(filePath);
          
          // File exists, proceed with deletion
          await this.deleteFile(action.filename);
          this.log(`File ${colors.cyan}${action.filename}${colors.reset} has been deleted.`, colors.green);
        } catch (error) {
          if (error.code === 'ENOENT') {
            this.log(`File ${colors.cyan}${action.filename}${colors.reset} does not exist.`, colors.red);
            this.log(`Try using /files to see available files.`, colors.yellow);
          } else {
            this.log(`Failed to delete file: ${error.message}`, colors.red);
          }
        }
      } else if (response === 'no' || response === 'n' || response === 'cancel') {
        this.log(`File deletion cancelled.`, colors.yellow);
      } else {
        this.log(`Please respond with 'yes' or 'no' to confirm deletion.`, colors.red);
        return; // Keep pending action active
      }
      
      // Clear pending action
      this.pendingAction = null;
    }
  }

  async createDirectory(dirname) {
    if (!dirname) {
      return this.log("Please specify a directory name.", colors.red);
    }
    
    try {
      const dirPath = path.resolve(this.currentDirectory, dirname);
      await fs.mkdir(dirPath, { recursive: true });
      this.log(`Created directory ${colors.cyan}${dirname}${colors.reset}`, colors.green);
    } catch (error) {
      this.log(`Error creating directory: ${error.message}`, colors.red);
    }
  }

  // Advanced Codebase Analysis Methods
  async analyzeCodebase(targetPath = null) {
    const analyzePath = targetPath ? path.resolve(this.currentDirectory, targetPath) : this.currentDirectory;
    
    this.log(`Analyzing codebase at: ${colors.cyan}${analyzePath}${colors.reset}`, colors.yellow);
    
    try {
      const analysis = await this.performCodebaseAnalysis(analyzePath);
      this.codebaseContext.set(analyzePath, analysis);
      
      this.log(`\nCodebase Analysis Results:`, colors.green);
      this.log(`Total Files: ${analysis.totalFiles}`, colors.white);
      this.log(`Total Lines: ${analysis.totalLines}`, colors.white);
      this.log(`Languages: ${analysis.languages.join(', ')}`, colors.white);
      this.log(`Dependencies: ${analysis.dependencies.length}`, colors.white);
      this.log(`Architecture: ${analysis.architecture}`, colors.white);
      
      if (analysis.issues.length > 0) {
        this.log(`\nPotential Issues Found:`, colors.yellow);
        analysis.issues.forEach(issue => {
          this.log(`  • ${issue}`, colors.red);
        });
      }
      
      if (analysis.suggestions.length > 0) {
        this.log(`\nSuggestions:`, colors.cyan);
        analysis.suggestions.forEach(suggestion => {
          this.log(`  • ${suggestion}`, colors.white);
        });
      }
      
    } catch (error) {
      this.log(`Error analyzing codebase: ${error.message}`, colors.red);
    }
  }

  async performCodebaseAnalysis(dirPath) {
    const analysis = {
      totalFiles: 0,
      totalLines: 0,
      languages: new Set(),
      dependencies: [],
      architecture: 'Unknown',
      issues: [],
      suggestions: []
    };

    const fileExtensions = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'React JSX',
      '.tsx': 'React TSX',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.cs': 'C#',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown'
    };

    const processFile = async (filePath) => {
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          analysis.totalFiles++;
          
          const ext = path.extname(filePath).toLowerCase();
          if (fileExtensions[ext]) {
            analysis.languages.add(fileExtensions[ext]);
          }
          
          // Count lines for code files
          if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.cs'].includes(ext)) {
            const content = await fs.readFile(filePath, 'utf8');
            analysis.totalLines += content.split('\n').length;
          }
          
          // Check for package.json
          if (path.basename(filePath) === 'package.json') {
            try {
              const packageContent = await fs.readFile(filePath, 'utf8');
              const packageData = JSON.parse(packageContent);
              if (packageData.dependencies) {
                analysis.dependencies.push(...Object.keys(packageData.dependencies));
              }
              if (packageData.devDependencies) {
                analysis.dependencies.push(...Object.keys(packageData.devDependencies));
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      } catch (error) {
        // Ignore file access errors
      }
    };

    const walkDirectory = async (dir) => {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            if (!item.name.startsWith('.') && item.name !== 'node_modules') {
              await walkDirectory(fullPath);
            }
          } else {
            await processFile(fullPath);
          }
        }
      } catch (error) {
        // Ignore directory access errors
      }
    };

    await walkDirectory(dirPath);
    
    // Determine architecture
    if (analysis.languages.has('JavaScript') || analysis.languages.has('TypeScript')) {
      analysis.architecture = 'Node.js/JavaScript';
    } else if (analysis.languages.has('Python')) {
      analysis.architecture = 'Python';
    } else if (analysis.languages.has('Java')) {
      analysis.architecture = 'Java';
    }
    
    // Generate suggestions
    if (analysis.totalFiles > 100) {
      analysis.suggestions.push('Consider modularizing large codebase');
    }
    if (analysis.languages.size > 3) {
      analysis.suggestions.push('Multiple languages detected - consider standardization');
    }
    
    analysis.languages = Array.from(analysis.languages);
    return analysis;
  }

  async searchCodebase(query) {
    if (!query) {
      return this.log("Please specify a search query.", colors.red);
    }
    
    this.log(`Searching for: ${colors.cyan}${query}${colors.reset}`, colors.yellow);
    
    const results = [];
    const searchInFile = async (filePath) => {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              file: path.relative(this.currentDirectory, filePath),
              line: index + 1,
              content: line.trim()
            });
          }
        });
      } catch (error) {
        // Ignore file read errors
      }
    };

    const walkAndSearch = async (dir) => {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            if (!item.name.startsWith('.') && item.name !== 'node_modules') {
              await walkAndSearch(fullPath);
            }
          } else if (item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.cs', '.json', '.md'].includes(ext)) {
              await searchInFile(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore directory access errors
      }
    };

    await walkAndSearch(this.currentDirectory);
    
    if (results.length === 0) {
      this.log(`No results found for: ${colors.cyan}${query}${colors.reset}`, colors.red);
    } else {
      this.log(`\nFound ${results.length} results:`, colors.green);
      results.slice(0, 10).forEach(result => {
        this.log(`  ${colors.cyan}${result.file}:${result.line}${colors.reset} ${result.content}`, colors.white);
      });
      
      if (results.length > 10) {
        this.log(`  ... and ${results.length - 10} more results`, colors.dim);
      }
    }
  }

  async showCodebaseStructure() {
    this.log(`Codebase Structure:`, colors.yellow);
    
    const printStructure = async (dir, prefix = '', maxDepth = 3, currentDepth = 0) => {
      if (currentDepth >= maxDepth) return;
      
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        const sortedItems = items.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });
        
        for (let i = 0; i < sortedItems.length; i++) {
          const item = sortedItems[i];
          const isLast = i === sortedItems.length - 1;
          const itemPrefix = isLast ? '└── ' : '├── ';
          const nextPrefix = isLast ? '    ' : '│   ';
          
          const relativePath = path.relative(this.currentDirectory, path.join(dir, item.name));
          const icon = item.isDirectory() ? '[DIR]' : '[FILE]';
          
          this.log(`${prefix}${itemPrefix}${icon} ${colors.cyan}${item.name}${colors.reset}`, colors.white);
          
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            await printStructure(path.join(dir, item.name), prefix + nextPrefix, maxDepth, currentDepth + 1);
          }
        }
      } catch (error) {
        // Ignore directory access errors
      }
    };
    
    await printStructure(this.currentDirectory);
  }

  async analyzeDependencies() {
    this.log(`Analyzing dependencies...`, colors.yellow);
    
    try {
      const packagePath = path.join(this.currentDirectory, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      this.log(`\nPackage: ${colors.cyan}${packageData.name || 'Unknown'}${colors.reset}`, colors.green);
      this.log(`Version: ${colors.cyan}${packageData.version || 'Unknown'}${colors.reset}`, colors.white);
      
      if (packageData.dependencies) {
        this.log(`\nDependencies (${Object.keys(packageData.dependencies).length}):`, colors.yellow);
        Object.entries(packageData.dependencies).forEach(([name, version]) => {
          this.log(`  • ${colors.cyan}${name}${colors.reset}: ${version}`, colors.white);
        });
      }
      
      if (packageData.devDependencies) {
        this.log(`\nDev Dependencies (${Object.keys(packageData.devDependencies).length}):`, colors.yellow);
        Object.entries(packageData.devDependencies).forEach(([name, version]) => {
          this.log(`  • ${colors.cyan}${name}${colors.reset}: ${version}`, colors.white);
        });
      }
      
      if (packageData.scripts) {
        this.log(`\nScripts:`, colors.yellow);
        Object.entries(packageData.scripts).forEach(([name, script]) => {
          this.log(`  • ${colors.cyan}${name}${colors.reset}: ${script}`, colors.white);
        });
      }
      
    } catch (error) {
      this.log(`Error analyzing dependencies: ${error.message}`, colors.red);
    }
  }

  async refactorCode(target, instructions) {
    if (!target) {
      return this.log("❌ Please specify a target file or pattern.", colors.red);
    }
    
    this.log(`🔧 Refactoring: ${colors.cyan}${target}${colors.reset}`, colors.yellow);
    
    if (!this.currentProvider) {
      this.log("❌ No AI provider selected. Use /switch <name>.", colors.red);
      return;
    }
    
    // Build refactoring prompt
    const refactorPrompt = `You are an expert code refactoring assistant. 

TARGET: ${target}
INSTRUCTIONS: ${instructions || 'Improve code quality, readability, and maintainability'}

Please analyze the code and provide a refactored version that:
1. Improves code structure and organization
2. Enhances readability and maintainability
3. Follows best practices and design patterns
4. Maintains functionality while improving quality
5. Includes comments explaining major changes

Respond with the complete refactored code in a code block:
\`\`\`${target}
[refactored code here]
\`\`\``;
    
    try {
      const p = aiProviders[this.currentProvider];
      const response = await p.send(refactorPrompt);
      
      // Process the refactored code
      const fileOpsPerformed = await this.executeFileOperations(response, [target]);
      
      if (fileOpsPerformed) {
        this.log(`✅ Refactoring completed for ${colors.cyan}${target}${colors.reset}`, colors.green);
        this.refactoringHistory.push({
          target,
          instructions,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      this.log(`❌ Error during refactoring: ${error.message}`, colors.red);
    }
  }

  async debugCode(target) {
    if (!target) {
      return this.log("❌ Please specify a target file.", colors.red);
    }
    
    this.log(`🐛 Debugging: ${colors.cyan}${target}${colors.reset}`, colors.yellow);
    
    if (!this.currentProvider) {
      this.log("❌ No AI provider selected. Use /switch <name>.", colors.red);
      return;
    }
    
    try {
      // Read the target file
      const filePath = path.resolve(this.currentDirectory, target);
      const content = await fs.readFile(filePath, 'utf8');
      
      const debugPrompt = `You are an expert debugging assistant. 

TARGET FILE: ${target}
CONTENT:
\`\`\`
${content}
\`\`\`

Please analyze this code and identify:
1. Potential bugs and issues
2. Error-prone patterns
3. Performance problems
4. Security vulnerabilities
5. Best practice violations

Provide a corrected version with fixes and explanations:
\`\`\`${target}
[corrected code with comments]
\`\`\``;
      
      const p = aiProviders[this.currentProvider];
      const response = await p.send(debugPrompt);
      
      // Process the debugged code
      const fileOpsPerformed = await this.executeFileOperations(response, [target]);
      
      if (fileOpsPerformed) {
        this.log(`✅ Debugging completed for ${colors.cyan}${target}${colors.reset}`, colors.green);
      }
      
    } catch (error) {
      this.log(`❌ Error during debugging: ${error.message}`, colors.red);
    }
  }

  async generateCode(type, specifications) {
    if (!type) {
      return this.log("❌ Please specify what to generate (e.g., 'component', 'api', 'test').", colors.red);
    }
    
    this.log(`⚡ Generating: ${colors.cyan}${type}${colors.reset}`, colors.yellow);
    
    if (!this.currentProvider) {
      this.log("❌ No AI provider selected. Use /switch <name>.", colors.red);
      return;
    }
    
    const generatePrompt = `You are an expert code generation assistant.

GENERATE: ${type}
SPECIFICATIONS: ${specifications || 'Follow best practices and current standards'}

Please generate high-quality, production-ready code that:
1. Follows modern best practices
2. Includes proper error handling
3. Has comprehensive documentation
4. Is well-structured and maintainable
5. Uses appropriate design patterns

Respond with the complete generated code in a code block:
\`\`\`filename.ext
[generated code here]
\`\`\``;
    
    try {
      const p = aiProviders[this.currentProvider];
      const response = await p.send(generatePrompt);
      
      // Process the generated code
      const fileOpsPerformed = await this.executeFileOperations(response, []);
      
      if (fileOpsPerformed) {
        this.log(`✅ Code generation completed for ${colors.cyan}${type}${colors.reset}`, colors.green);
      }
      
    } catch (error) {
      this.log(`❌ Error during code generation: ${error.message}`, colors.red);
    }
  }

  async createAutomation(name, description) {
    if (!name) {
      return this.log("❌ Please specify an automation name.", colors.red);
    }
    
    this.log(`🤖 Creating automation: ${colors.cyan}${name}${colors.reset}`, colors.yellow);
    
    if (!this.currentProvider) {
      this.log("❌ No AI provider selected. Use /switch <name>.", colors.red);
      return;
    }
    
    const automationPrompt = `You are an expert automation script generator.

AUTOMATION NAME: ${name}
DESCRIPTION: ${description || 'General development automation'}

Please generate a comprehensive automation script that:
1. Automates common development tasks
2. Includes error handling and logging
3. Is well-documented and configurable
4. Follows best practices for automation
5. Can be easily integrated into CI/CD pipelines

Generate both the script and a README explaining how to use it:
\`\`\`automation.js
[automation script]
\`\`\`

\`\`\`README.md
[automation documentation]
\`\`\``;
    
    try {
      const p = aiProviders[this.currentProvider];
      const response = await p.send(automationPrompt);
      
      // Process the automation code
      const fileOpsPerformed = await this.executeFileOperations(response, []);
      
      if (fileOpsPerformed) {
        this.log(`Automation created: ${colors.cyan}${name}${colors.reset}`, colors.green);
        this.automationTasks.set(name, {
          description,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      this.log(`Error creating automation: ${error.message}`, colors.red);
    }
  }

  async testWriteFile(filename, content) {
    if (!filename) {
      return this.log("Please specify a filename.", colors.red);
    }
    
    if (!content) {
      content = `// Test content for ${filename}
// Generated at ${new Date().toISOString()}
console.log('Hello from ${filename}');`;
    }
    
    this.log(`Testing file write: ${colors.cyan}${filename}${colors.reset}`, colors.yellow);
    
    try {
      await this.writeFile(filename, content);
      this.log(`Test write successful for ${colors.cyan}${filename}${colors.reset}`, colors.green);
    } catch (error) {
      this.log(`Test write failed: ${error.message}`, colors.red);
    }
  }
  
  // Intelligent file detection and operations
  async detectAndProcessFiles(message) {
    // Check for directory listing requests
    const listPatterns = [
      /(?:show|list|display)\s+(?:me\s+)?(?:all\s+)?files/i,
      /what files are (?:here|available|in this (?:folder|directory))/i,
      /(?:current|available)\s+files/i,
      /files in (?:this\s+)?(?:folder|directory)/i
    ];

    for (const pattern of listPatterns) {
      if (pattern.test(message)) {
        await this.listFiles();
        return [];
      }
    }

    // Check for explicit read-only requests
    const readOnlyPatterns = [
      /(?:show|display)\s+(?:me\s+)?(?:the\s+)?(?:content|contents)\s+of\s+(?:the\s+)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/gi,
      /(?:read|view|see)\s+(?:the\s+)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/gi,
      /what(?:'s|\s+is)\s+in\s+(?:the\s+)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/gi
    ];

    for (const pattern of readOnlyPatterns) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        const filename = match[1];
        await this.readFile(filename);
        return []; // Return empty array to prevent AI processing
      }
    }

    // Check for deletion requests and set up pending actions
    const deletePatterns = [
      /(?:delete|remove|rm)\s+(?:the\s+)?(?:file\s+)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/gi,
      /(?:delete|remove|rm)\s+(?:the\s+)?([a-zA-Z0-9_\-\.\/]+)/gi
    ];

    for (const pattern of deletePatterns) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        let filename = match[1];
        
        // Handle natural language descriptions of filenames
        if (message.toLowerCase().includes('copy') && message.toLowerCase().includes('readme')) {
          // Look for actual files that match the description
          try {
            const files = await fs.readdir(this.currentDirectory, { withFileTypes: true });
            const matchingFiles = files
              .filter(f => !f.isDirectory())
              .filter(f => f.name.toLowerCase().includes('copy') && f.name.toLowerCase().includes('readme'))
              .map(f => f.name);
            
            if (matchingFiles.length > 0) {
              filename = matchingFiles[0]; // Use the first matching file
              this.log(`Found matching file: ${colors.cyan}${filename}${colors.reset}`, colors.dim);
            }
          } catch (error) {
            // Continue with original filename if directory read fails
          }
        }
        
        // Set up pending deletion action
        this.pendingAction = {
          type: 'delete_confirmation',
          filename: filename
        };
        this.log(`Request to delete ${colors.cyan}${filename}${colors.reset} detected.`, colors.yellow);
        this.log(`Please confirm with 'yes' or 'no'.`, colors.yellow);
        return []; // Return empty array to prevent AI processing
      }
    }

    // Enhanced agent-like file detection patterns
    const agentPatterns = [
      // Create patterns (including typos like "crreade")
      /(?:create|crreade|make|generate|new)\s+(?:a\s+)?(?:new\s+)?([a-zA-Z0-9_\-\.\/]+(?:\.[a-zA-Z]+)?)/gi,
      /(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?file\s+(?:called\s+)?([a-zA-Z0-9_\-\.\/]+(?:\.[a-zA-Z]+)?)/gi,
      /(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?(?:readme|package\.json|config|script|app|server|index|main|test|docs?|documentation)/gi,
      
      // Edit/Update patterns - improved to catch more variations
      /(?:edit|update|modify|change|fix|improve|rewrite|debug|add\s+to)\s+([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/gi,
      /(?:edit|update|modify|change|fix|improve|rewrite|debug)\s+(?:the\s+)?(?:file\s+)?([a-zA-Z0-9_\-\.\/]+(?:\.[a-zA-Z]+)?)/gi,
      
      // Specific file references
      /(?:server\.js|index\.js|package\.json|readme\.md|config\.json)\s+(?:file\s+)?(?:is\s+)?(?:already\s+)?(?:there|here|exists)/gi,
      /(?:debug|fix)\s+(?:the\s+)?(?:server\.js|index\.js|package\.json|readme\.md|config\.json)\s+(?:file\s+)?(?:code)?/gi,
      
      // Delete patterns
      /(?:delete|remove|rm)\s+([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/gi,
      
      // Special file types
      /(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?(?:readme|package\.json|config|script|app|server|index|main|test|docs?|documentation)(?:\s+file)?/gi,
      
      // General file operations
      /(?:file|document)\s+([a-zA-Z0-9_\-\.\/]+(?:\.[a-zA-Z]+)?)/gi
    ];

    const detectedFiles = new Set();
    const detectedActions = new Set();
    
    for (const pattern of agentPatterns) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        const filename = match[1];
        if (filename) {
          detectedFiles.add(filename);
          
          // Determine action type
          if (pattern.source.includes('create') || pattern.source.includes('crreade') || pattern.source.includes('make') || pattern.source.includes('generate')) {
            detectedActions.add('create');
          } else if (pattern.source.includes('edit') || pattern.source.includes('update') || pattern.source.includes('modify') || pattern.source.includes('debug') || pattern.source.includes('fix')) {
            detectedActions.add('edit');
          } else if (pattern.source.includes('delete') || pattern.source.includes('remove')) {
            detectedActions.add('delete');
          }
        }
      }
    }

    // Handle specific file references that don't match the standard patterns
    const specificFilePatterns = [
      /(?:server\.js|index\.js|package\.json|readme\.md|config\.json)\s+(?:file\s+)?(?:is\s+)?(?:already\s+)?(?:there|here|exists)/gi,
      /(?:debug|fix)\s+(?:the\s+)?(?:server\.js|index\.js|package\.json|readme\.md|config\.json)\s+(?:file\s+)?(?:code)?/gi
    ];

    for (const pattern of specificFilePatterns) {
      if (pattern.test(message)) {
        // Extract the specific filename from the message
        const fileMatch = message.match(/(server\.js|index\.js|package\.json|readme\.md|config\.json)/i);
        if (fileMatch) {
          const filename = fileMatch[1];
          detectedFiles.add(filename);
          detectedActions.add('edit');
          this.log(`Detected specific file reference: ${colors.cyan}${filename}${colors.reset}`, colors.dim);
        }
      }
    }

    // Additional pattern for direct file mentions
    const directFilePattern = /(server\.js|index\.js|package\.json|readme\.md|config\.json)/gi;
    let directMatch;
    while ((directMatch = directFilePattern.exec(message)) !== null) {
      const filename = directMatch[1];
      if (!detectedFiles.has(filename)) {
        detectedFiles.add(filename);
        detectedActions.add('edit');
        this.log(`Detected direct file mention: ${colors.cyan}${filename}${colors.reset}`, colors.dim);
      }
    }

    // Handle special file types without explicit names
    const specialFilePatterns = [
      /(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?readme/gi,
      /(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?package\.json/gi,
      /(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?config/gi,
      /(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?server/gi,
      /(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?index/gi
    ];

    for (const pattern of specialFilePatterns) {
      if (pattern.test(message)) {
        const match = pattern.source.match(/(?:create|crreade|make|generate)\s+(?:a\s+)?(?:new\s+)?([a-zA-Z0-9_\-\.\/]+)/i);
        if (match) {
          let filename = match[1];
          if (filename === 'readme') filename = 'README.md';
          else if (filename === 'package.json') filename = 'package.json';
          else if (filename === 'config') filename = 'config.json';
          else if (filename === 'server') filename = 'server.js';
          else if (filename === 'index') filename = 'index.js';
          
          detectedFiles.add(filename);
          detectedActions.add('create');
        }
      }
    }

    // Auto-read detected files if they exist (for context only, no writing)
    for (const filename of detectedFiles) {
      try {
        const filePath = path.resolve(this.currentDirectory, filename);
        const content = await fs.readFile(filePath, 'utf8');
        this.fileContext.set(filename, content);
        this.log(`Auto-loaded ${colors.cyan}${filename}${colors.reset} for editing context`, colors.dim);
      } catch (error) {
        // File doesn't exist - that's ok, AI might want to create it
        this.log(`${colors.cyan}${filename}${colors.reset} not found - AI can create it`, colors.dim);
      }
    }

    // Store actions for AI context
    this.detectedActions = Array.from(detectedActions);
    
    // Debug logging
    if (detectedFiles.size > 0) {
      this.log(`Detected files: ${Array.from(detectedFiles).join(', ')}`, colors.dim);
      this.log(`Detected actions: ${this.detectedActions.join(', ')}`, colors.dim);
    } else {
      this.log(`No files detected in message: "${message}"`, colors.dim);
    }
    
    return Array.from(detectedFiles);
  }

  async executeFileOperations(aiResponse, mentionedFiles) {
    // Check if AI wants to write/update files using standard code blocks
    const codeBlockPattern = /```([a-zA-Z0-9_\-\.]+)\n([\s\S]*?)```/gi;
    const fileUpdatePattern = /```(?:FILE_UPDATE|UPDATE_FILE):\s*([^\n]+)\n([\s\S]*?)```/gi;
    const fileCreatePattern = /```(?:FILE_CREATE|CREATE_FILE):\s*([^\n]+)\n([\s\S]*?)```/gi;
    
    let match;
    let operationsPerformed = false;

    // Handle explicit file update commands
    while ((match = fileUpdatePattern.exec(aiResponse)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();
      
      try {
        await this.writeFile(filename, content);
        this.log(`AI updated ${colors.cyan}${filename}${colors.reset}`, colors.green);
        operationsPerformed = true;
      } catch (error) {
        this.log(`AI failed to update ${filename}: ${error.message}`, colors.red);
      }
    }

    // Handle explicit file creation commands  
    while ((match = fileCreatePattern.exec(aiResponse)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();
      
      try {
        await this.writeFile(filename, content);
        this.log(`AI created ${colors.cyan}${filename}${colors.reset}`, colors.green);
        operationsPerformed = true;
      } catch (error) {
        this.log(`AI failed to create ${filename}: ${error.message}`, colors.red);
      }
    }

    // Handle standard code blocks with filenames (AGENT MODE)
    const codeBlocks = [];
    const regex = /```([a-zA-Z0-9_\-\.]+)\n([\s\S]*?)```/gi;
    while ((match = regex.exec(aiResponse)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();
      
      // Only process if it looks like a real filename (has extension or is a common file)
      if ((filename.includes('.') && !filename.includes(' ')) || 
          ['README', 'package.json', 'config', 'server', 'index', 'main'].some(name => 
            filename.toLowerCase().includes(name.toLowerCase()))) {
        codeBlocks.push({ filename, content });
        this.log(`Found code block for ${colors.cyan}${filename}${colors.reset} (${content.length} characters)`, colors.dim);
        
        // Log a preview of the content
        const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        this.log(`Content preview: ${preview.replace(/\n/g, '\\n')}`, colors.dim);
      }
    }
    
    this.log(`Total code blocks found: ${codeBlocks.length}`, colors.dim);

    // AGENT MODE: Automatically process code blocks if actions were detected
    for (const block of codeBlocks) {
      let shouldWrite = false;
      
      // AGENT MODE: If we detected any actions, be more aggressive
      if (this.detectedActions?.length > 0) {
        shouldWrite = true;
        this.log(`Agent mode detected - processing ${colors.cyan}${block.filename}${colors.reset}`, colors.dim);
      }
      
      // Check if this file was mentioned in the original request
      if (mentionedFiles.includes(block.filename) || 
          mentionedFiles.some(f => f.toLowerCase() === block.filename.toLowerCase())) {
        shouldWrite = true;
        this.log(`File mentioned in request - processing ${colors.cyan}${block.filename}${colors.reset}`, colors.dim);
      }
      
      // Check if this matches any detected actions
      if (this.detectedActions?.includes('create') && 
          (block.filename.toLowerCase().includes('readme') || 
           block.filename.toLowerCase().includes('package') ||
           block.filename.toLowerCase().includes('config') ||
           block.filename.toLowerCase().includes('server') ||
           block.filename.toLowerCase().includes('index'))) {
        shouldWrite = true;
      }
      
      // Check if this matches any detected actions
      if (this.detectedActions?.includes('edit') && 
          (block.filename.toLowerCase().includes('readme') || 
           block.filename.toLowerCase().includes('package') ||
           block.filename.toLowerCase().includes('config') ||
           block.filename.toLowerCase().includes('server') ||
           block.filename.toLowerCase().includes('index'))) {
        shouldWrite = true;
        this.log(`Edit action detected - processing ${colors.cyan}${block.filename}${colors.reset}`, colors.dim);
      }
      
      // If it's a create action and the file doesn't exist, create it
      if (this.detectedActions?.includes('create')) {
        try {
          const filePath = path.resolve(this.currentDirectory, block.filename);
          await fs.access(filePath);
          // File exists, skip creation
        } catch (error) {
          // File doesn't exist, safe to create
          shouldWrite = true;
        }
      }
      
      // FORCE WRITE if filename exactly matches any mentioned files
      if (mentionedFiles.some(f => f.toLowerCase() === block.filename.toLowerCase())) {
        shouldWrite = true;
        this.log(`FORCE WRITE: Exact filename match for ${colors.cyan}${block.filename}${colors.reset}`, colors.red);
      }
      
      if (shouldWrite) {
        // Validate content is substantial
        if (block.content.length < 10) {
          this.log(`Content for ${colors.cyan}${block.filename}${colors.reset} seems too short (${block.content.length} chars). Skipping.`, colors.yellow);
          continue;
        }
        
        try {
          await this.writeFile(block.filename, block.content);
          this.log(`AI created/updated ${colors.cyan}${block.filename}${colors.reset} (${block.content.length} characters)`, colors.green);
          operationsPerformed = true;
        } catch (error) {
          this.log(`AI failed to create/update ${block.filename}: ${error.message}`, colors.red);
        }
      }
    }

    return operationsPerformed;
  }

  async showBanner(providerKey) {
    const banner = providerBanners[providerKey];
    if (!banner) return;
    
    console.log("\n");
    const providerColor = aiProviders[providerKey].color;
    
    for (let line of banner) {
      await this.simulateTyping(`${providerColor}${line}${colors.reset}`, 3);
    }
    console.log();
  }

  async sendToAi(message) {
    const p = aiProviders[this.currentProvider];
    
    this.log(`\nAnalyzing for file operations...`, colors.dim);
    
    // Detect and auto-load files or execute file operations
    const mentionedFiles = await this.detectAndProcessFiles(message);
    
    // If this was just a file listing request, don't send to AI
    const listPatterns = [
      /(?:show|list|display)\s+(?:me\s+)?(?:all\s+)?files/i,
      /what files are (?:here|available|in this (?:folder|directory))/i,
      /(?:current|available)\s+files/i,
      /files in (?:this\s+)?(?:folder|directory)/i
    ];

    // If this was just a read-only request, don't send to AI
    const readOnlyPatterns = [
      /(?:show|display)\s+(?:me\s+)?(?:the\s+)?(?:content|contents)\s+of\s+(?:the\s+)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/i,
      /(?:read|view|see)\s+(?:the\s+)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/i,
      /what(?:'s|\s+is)\s+in\s+(?:the\s+)?([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z]+)/i
    ];

    for (const pattern of listPatterns) {
      if (pattern.test(message)) {
        return; // Already handled by detectAndProcessFiles
      }
    }

    for (const pattern of readOnlyPatterns) {
      if (pattern.test(message)) {
        return; // Already handled by detectAndProcessFiles
      }
    }
    
    // Build enhanced message with file context and AI instructions
    let enhancedMessage = `You are an intelligent AI assistant with file system access. You can help users with both general questions and file operations in the directory: ${this.currentDirectory}

DETECTED ACTION: ${this.detectedActions?.length > 0 ? this.detectedActions.join(', ') : 'none detected'}

SYSTEM: You have 4000 tokens available. When creating files, use ALL available tokens to provide complete, comprehensive file content. Do not truncate or summarize.

When you need to create or update files, respond with the file content in code blocks like this:
\`\`\`filename.ext
[complete file content here]
\`\`\`

AGENT INSTRUCTIONS:
- You can help with ANY type of question - general knowledge, coding, file operations, etc.
- If the user asks a general question (like "capital of Pakistan"), answer it normally
- If the user wants to CREATE a file, generate appropriate content based on the file type and context
- If the user wants to EDIT a file, modify the existing content as requested
- If the user wants to DELETE a file, confirm the action
- Be proactive and helpful - if someone says "create readme file", create a proper README.md
- ALWAYS respond with the complete file content in code blocks when creating or editing files
- NEVER truncate or summarize file content - provide the FULL complete file
- When editing existing files, analyze the current content and provide an improved version
- For debugging/fixing files, identify issues and provide corrected code
- CRITICAL: When the user mentions a specific file (like "server.js"), you MUST provide the complete updated file content in a code block
- CRITICAL: Do not just explain what to do - actually provide the complete code that should replace the file
- For common files, use standard formats:
  * README.md: Include project description, installation, usage, examples, contributing
  * package.json: Include name, version, description, dependencies, scripts, keywords
  * server.js: Basic Express server setup with error handling
  * index.js: Main application entry point with proper imports
  * config.json: Configuration settings with comments

CRITICAL: When creating files, you MUST respond with the complete file content in a code block like this:
\`\`\`filename.ext
[complete file content here - DO NOT TRUNCATE]
\`\`\`

IMPORTANT: Provide the ENTIRE file content, not just a portion. The file should be complete and ready to use.

IMPORTANT: Only modify files when explicitly asked to edit, update, or create them. Never modify files when users just want to read or view them.

Available files in current directory:`;

    try {
      const files = await fs.readdir(this.currentDirectory, { withFileTypes: true });
      const fileList = files
        .filter(f => !f.isDirectory())
        .map(f => f.name)
        .join(', ');
      enhancedMessage += `\n${fileList || 'No files found'}`;
    } catch (error) {
      enhancedMessage += `\nCould not read directory contents`;
    }

    enhancedMessage += `\n\nFiles currently loaded in context:`;

    if (this.fileContext.size > 0) {
      for (const [filename, content] of this.fileContext.entries()) {
        enhancedMessage += `\n\n${filename}:\n\`\`\`\n${content.substring(0, 500)}${content.length > 500 ? '...[truncated]' : ''}\n\`\`\``;
      }
    } else {
      enhancedMessage += "\nNo files currently loaded.";
    }

    // Add conversation history for context
    if (this.conversationHistory.length > 0) {
      enhancedMessage += `\n\nRecent conversation history:`;
      const recentHistory = this.conversationHistory.slice(-3); // Last 3 exchanges
      for (const exchange of recentHistory) {
        enhancedMessage += `\nUser: ${exchange.user}`;
        enhancedMessage += `\nAI: ${exchange.ai}`;
      }
    }

    enhancedMessage += `\n\nUser request: ${message}`;

    this.log(`${p.color}${p.name}${colors.reset} is processing...`, colors.dim);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    
    let reply = "No response handler configured.";

    if (typeof p.send === "function") {
      reply = await p.send(enhancedMessage);
      
      // Store conversation history
      this.conversationHistory.push({
        user: message,
        ai: reply
      });
      
      // Keep only last 10 exchanges to prevent memory bloat
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }
      // Extract checklist from AI response
      this.checklist = this.extractChecklistFromText(reply);
    }

    // Process any file operations in the AI response (AGENT MODE)
    const fileOpsPerformed = await this.executeFileOperations(reply, mentionedFiles);
    
    // Clean up the response for display (remove file operation blocks)
    let cleanedReply = reply;
    
    // Remove explicit file operation blocks
    cleanedReply = cleanedReply.replace(/```(?:FILE_UPDATE|CREATE_FILE|UPDATE_FILE):[^\n]+\n[\s\S]*?```/gi, '');
    
    // For agent mode, replace code blocks with file names with a message
    if (this.detectedActions?.length > 0) {
      cleanedReply = cleanedReply.replace(/```([a-zA-Z0-9_\-\.]+)\n[\s\S]*?```/g, (match, filename) => {
        // Only replace if it looks like a real filename
        if (filename.includes('.') || ['README', 'package.json', 'config', 'server', 'index', 'main'].some(name => 
            filename.toLowerCase().includes(name.toLowerCase()))) {
          return `[File content for ${filename} processed]`;
        }
        return match; // Keep other code blocks
      });
    }
    
    cleanedReply = cleanedReply.trim();

    process.stdout.write("\x1b[1A\x1b[2K");
    this.log(`\n${colors.bright}${p.color}${p.name}:${colors.reset}`);
    
    if (cleanedReply) {
      await this.simulateTyping(`${cleanedReply}`);
    }
    
    if (fileOpsPerformed) {
      this.log(`\nFile operations completed automatically`, colors.green);
    }
    // After displaying AI response, show checklist if present
    if (this.checklist.length) {
      this.displayChecklist();
    }
  }

  setPrompt() {
    const p = aiProviders[this.currentProvider];
    const time = new Date().toLocaleTimeString();
    const contextCount = this.fileContext.size > 0 ? `[${this.fileContext.size}]` : '';
    this.rl.setPrompt(
      `${colors.dim}[${time}] ${colors.cyan}${this.userName}${contextCount}${colors.reset} ${p ? p.color + this.currentProvider : ""}${colors.reset}${colors.bright} > ${colors.reset}`
    );
    this.rl.prompt();
  }

  exitCLI() {
    this.log("\nExiting COHORA AI CLI. See you soon!", colors.green);
    process.exit(0);
  }

  start() {
    this.showIntro().then(() => {
      this.setPrompt();
    });
  }

  extractChecklistFromText(text) {
    // Extract lines that look like checklist items
    const lines = text.split(/\r?\n/);
    const checklist = [];
    for (const line of lines) {
      const match = line.match(/^\s*([\-\*•\u25CB\u25CF\u25A0\u25A1\u2610\u2611\u2022])\s*(\[.\])?\s*(.+)$/);
      if (match) {
        checklist.push({
          text: match[3].trim(),
          status: (match[2] && match[2].includes('x')) ? 'done' : 'pending'
        });
      }
    }
    return checklist;
  }

  displayChecklist() {
    if (!this.checklist.length) {
      this.log("\nNo checklist items found.", colors.yellow);
      return;
    }
    this.log("\nChecklist:", colors.yellow);
    let i = 1;
    for (const item of this.checklist) {
      let symbol = item.status === 'done' ? colors.green + 'DONE' : colors.cyan + 'TODO';
      this.log(`  ${symbol}${colors.reset} ${item.text}`);
      i++;
    }
    console.log();
  }
}

const cli = new CohoraAiCli();
cli.start();