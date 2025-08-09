<h1 align="center">🧠 COHORA AI CLI Assistant</h1>
<p align="center"><i>Seamlessly switch and chat with top AI models from your terminal.</i></p>
<img width="878" height="372" alt="image" src="https://github.com/user-attachments/assets/b0ff7728-e7f1-4164-a51c-2f6a170c52b2" />

---

## 🚀 Features

- 🔄 **Switchable AI Models** — Instantly switch between Claude and Grok AI models.
- 🎨 **Animated ASCII Banners** — Beautiful provider banners for a slick experience.
- ⌨️ **Interactive CLI** — Type commands and messages naturally.
- 📁 **Intelligent File Operations** — AI automatically detects and performs file operations.
- 🤖 **Agent Mode** — Natural language file creation, editing, and management.
- 🔍 **Advanced Codebase Analysis** — Analyze, refactor, debug, and generate code.
- 📦 **Modular Design** — Clean, extensible architecture.
- 🌈 **Styled Output** — Colorful and readable logs.

---

## 🧠 Available Providers

| Provider  | Model                         | Command            |
|-----------|-------------------------------|---------------------|
| Claude    | claude-3-opus                 | `/switch claude`    |
| Grok      | grok-3-latest                 | `/switch grok`      |

---

## 🧾 Commands

### AI Commands
- `/list` — View available AI providers
- `/switch <provider>` — Set the current AI model
- `/status` — Show the active model
- `/current` — Show selected AI
- `/reset` — Deselect provider
- `/clear-history` — Clear conversation history
- `/name [new-name]` — Set or show current user name

### Advanced Codebase Features
- `/analyze [path]` — Analyze codebase structure and metrics
- `/search <query>` — Search codebase for specific terms
- `/structure` — Show codebase directory structure
- `/deps` — Analyze project dependencies
- `/refactor <file>` — Refactor code with AI assistance
- `/debug <file>` — Debug and fix code issues
- `/generate <type>` — Generate code (component, api, test, etc.)
- `/automate <name>` — Create automation scripts

### File System Commands
- `/files [dir]` — List files in directory
- `/pwd` — Show current directory
- `/cd <dir>` — Change directory
- `/read <file>` — Read file content
- `/write <file> <text>` — Write text to file
- `/create <file>` — Create new file
- `/delete <file>` — Delete file
- `/mkdir <dir>` — Create directory

### Agent Mode - Smart File Operations
AI automatically detects file operations from natural language:
- `"create readme file"` → Creates README.md
- `"make server.js"` → Creates server.js
- `"update index.js with new features"` → Edits index.js
- `"delete oldfile.txt"` → Deletes file

### General Commands
- `/help` — Show all commands
- `/clear` — Clear screen and redraw banner
- `/exit` — Quit the CLI
- `/todo` — Display checklist items

---

## 📦 Setup

1. **Clone the project**

   ```bash
   git clone https://github.com/your-username/cohora-cli.git
   cd cohora-cli
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file**

   ```env
   CLAUDE_API_KEY=your_claude_api_key
   GROK_API_KEY=your_grok_api_key
   ```

4. **Run the CLI**

   ```bash
   node index.js
   ```

---

## 📷 Preview

```bash
 ██████╗ ██████╗ ██╗  ██╗ ██████╗ ██████╗  █████╗       ██████╗██╗     ██╗
██╔════╝██╔═══██╗██║  ██║██╔═══██╗██╔══██╗██╔══██╗     ██╔════╝██║     ██║
██║     ██║   ██║███████║██║   ██║██████╔╝███████║     ██║     ██║     ██║
██║     ██║   ██║██╔══██║██║   ██║██╔══██╗██╔══██║     ██║     ██║     ██║
╚██████╗╚██████╔╝██║  ██║╚██████╔╝██║  ██║██║  ██║     ╚██████╗███████╗██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝╚══════╝╚═╝

      Welcome to COHORA AI CLI Assistant

✨ Initializing modules...
⚙️ AI Engines warming up...
📁 File system integration active...
🧠 Intelligent file operations enabled...

🚀 COHORA AI CLI Agent is now up and running!
🧭 Use /list to view available AI engines.
🔄 Use /switch <provider> to activate one.
📂 Use /files to explore local files.
🤖 AGENT MODE: Try natural commands like "create readme file"!
📘 Type /help to explore all commands.
```

---

## ⚡ Agent Mode Examples

COHORA CLI features intelligent agent mode that understands natural language:

```bash
user > create a new readme file
🤖 AI created README.md

user > make a package.json for my project
🤖 AI created package.json

user > debug server.js and fix the errors
🤖 AI updated server.js

user > analyze my codebase structure
📊 Codebase Analysis Results:
📁 Total Files: 23
📝 Total Lines: 1,847
🔧 Languages: JavaScript, TypeScript, JSON
```

---

## 🧩 License

MIT License — use it freely, fork it, contribute, and extend.  
Crafted with ❤️ by the Cohora Team.
