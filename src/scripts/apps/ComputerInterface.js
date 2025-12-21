import { AudioController } from "../audio.js";
import { LINKS } from "../constants.js";
import { HackingGameRegistry } from "../hacking/HackingGameRegistry.js";
import { MoshSocket } from "../socket.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ComputerInterface extends HandlebarsApplicationMixin(
  ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: "fvtt-mii-computer-interface",
    tag: "div",
    position: {
      width: 500,
      height: 550,
    },
    window: {
      title: "FVTT-MII.Interface.Title",
      resizable: true,
      icon: "fas fa-desktop",
    },
    classes: ["fvtt-mii"],
  };

  static PARTS = {
    content: {
      template:
        "modules/mothership-interactive-terminal/templates/interface.hbs",
    },
  };

  static _instance = null;

  static show() {
    if (!this._instance) {
      this._instance = new ComputerInterface();
    }
    this._instance.render(true);
    MoshSocket.emitRequestState();
    AudioController.play("STARTUP");
  }

  static receiveUpdate(newState) {
    if (this._instance) {
      this._instance._handleStateUpdate(newState);
    }
  }

  static handleStateRequest() {
    if (
      this._instance &&
      (this._instance.isController ||
        (game.user.isGM && !this._instance.computerState.controllerId))
    ) {
      MoshSocket.emitUpdate(this._instance.computerState);
    }
  }

  static parseHackableInstructions(text, allTypes) {
    if (!text) return null;

    const tokens = text.toLowerCase().split(/[\s,]+/);
    if (tokens.includes("all")) {
      return allTypes;
    }

    const enabledTypes = allTypes.filter((type) => tokens.includes(type));
    return enabledTypes.length > 0 ? enabledTypes : null;
  }

  get title() {
    return (
      game.settings.get("mothership-interactive-terminal", "interfaceTitle") ||
      game.i18n.localize("FVTT-MII.Interface.Title")
    );
  }

  constructor(options) {
    super(options);
    this.computerState = {
      controllerId: null,
      view: "login",
      activeApp: null,
      activeFile: null,
      cameraIndex: 0,
      loginError: false,
      currentUser: null,
      dataSourceId: null,
      cliHistory: [],
      hackingState: null,
      canHack: false,
      hackTargetId: null,
      usernameInput: "",
      focusedElement: null,
      crackedPassword: null,
    };

    this.files = {};
    this.cameras = [];

    // Listen for actor updates to refresh ship status
    Hooks.on("updateActor", this._onActorUpdate.bind(this));
  }

  _onActorUpdate(actor, changes, options, userId) {
    if (
      this.shipActorName &&
      actor.name === this.shipActorName &&
      this.computerState.view === "desktop"
    ) {
      this.render();
    }
  }

  async _handleStateUpdate(newState) {
    const oldDataSourceId = this.computerState.dataSourceId;

    // Merge state
    this.computerState = { ...this.computerState, ...newState };

    // Sync active game state if hacking
    if (
      this.computerState.view === "hacking" &&
      this.computerState.hackingType &&
      this.computerState.hackingState
    ) {
      if (this.activeGame) {
        // If game type changed, recreate
        if (
          this.activeGame.constructor.type !== this.computerState.hackingType
        ) {
          this.activeGame = HackingGameRegistry.restore(
            this.computerState.hackingType,
            this.computerState.hackingState,
            this
          );
        } else {
          this.activeGame.state = this.computerState.hackingState;
        }
      }
    } else {
      this.activeGame = null;
    }

    // Check if we need to load data
    if (
      this.computerState.dataSourceId &&
      this.computerState.dataSourceId !== oldDataSourceId
    ) {
      const journal = game.journal.get(this.computerState.dataSourceId);
      if (journal) {
        await this._loadUserData(journal);
      }
    } else if (!this.computerState.dataSourceId && oldDataSourceId) {
      // Logout happened
      this.files = {};
      this.cameras = [];
    }

    this.render();
  }

  async _loadUserData(journalEntry) {
    this.files = {};
    this.cameras = [];
    this.hasShipAccess = false;
    this.isCLIOnly = false;

    if (journalEntry) {
      const pages = journalEntry.pages.contents;

      for (const page of pages) {
        // Check for CLI mode
        if (page.name === "CLI") {
          this.isCLIOnly = true;
          continue;
        }

        // Check for Ship Status access
        if (page.name === "SHIPSTATUS") {
          this.hasShipAccess = true;
          // Try to get ship name from content
          if (page.type === "text") {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = page.text.content;
            this.shipActorName =
              tempDiv.textContent.trim() || tempDiv.innerText.trim();
          }
          continue;
        }

        // Check for HACKABLE
        if (page.name === "HACKABLE") {
          continue;
        }

        // Check for Macro
        if (page.name.startsWith("MACRO:")) {
          let macroName = "";
          if (page.type === "text") {
            // Strip HTML tags to get the macro name
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = page.text.content;
            macroName = tempDiv.textContent.trim() || tempDiv.innerText.trim();
          }

          this.files[page.id] = {
            id: page.id,
            title: page.name.replace("MACRO:", "").trim(),
            content: macroName,
            type: "macro",
            isImage: false,
            isMacro: true,
          };
          continue;
        }

        // Check if it's a camera based on name
        if (page.name.startsWith("CAM:")) {
          let imgSrc =
            "modules/mothership-interactive-terminal/images/cam001.png"; // Fallback

          if (page.type === "image") {
            imgSrc = page.src;
          }

          this.cameras.push({
            name: page.name.replace("CAM:", "").trim(),
            src: imgSrc,
          });
        } else {
          // It's a file
          let content = "";
          let type = "text";

          if (page.type === "text") {
            // Use the HTML content directly from the journal page
            content = page.text.content;
          } else if (page.type === "image") {
            type = "image";
            content = page.src;
          }

          this.files[page.id] = {
            id: page.id,
            title: page.name,
            content: content,
            type: type,
            isImage: type === "image",
          };
        }
      }
    }

    // Sort cameras by name
    this.cameras.sort((a, b) => a.name.localeCompare(b.name));
  }

  get isController() {
    return this.computerState.controllerId === game.user.id;
  }

  get canInteract() {
    return this.isController || this.computerState.controllerId === null;
  }

  async _prepareContext(options) {
    const controllerName = this.computerState.controllerId
      ? game.users.get(this.computerState.controllerId)?.name
      : game.i18n.localize("FVTT-MII.Interface.None");

    const fileList = Object.values(this.files);
    const hasFiles = fileList.length > 0;
    const hasCameras = this.cameras.length > 0;
    const activeCamera = hasCameras
      ? this.cameras[this.computerState.cameraIndex] || this.cameras[0]
      : null;

    const osVersion =
      game.settings.get("mothership-interactive-terminal", "osVersion") ||
      game.i18n.localize("FVTT-MII.Interface.OSVersion");

    // Ship Status
    const shipActorName = this.shipActorName;
    const shipActor = shipActorName
      ? game.actors.find((a) => a.name === shipActorName)
      : null;
    let shipStatus = null;

    if (shipActor) {
      const system = shipActor.system;

      if (
        system.supplies &&
        system.supplies.hull &&
        system.supplies.fuel &&
        system.stats.oxygen
      ) {
        shipStatus = {
          hull: {
            value: system.supplies.hull.value,
            max: system.supplies.hull.max,
            pct: Math.round(
              (system.supplies.hull.value / system.supplies.hull.max) * 100
            ),
          },
          fuel: {
            value: system.supplies.fuel.value,
            max: system.supplies.fuel.max,
            pct: Math.round(
              (system.supplies.fuel.value / system.supplies.fuel.max) * 100
            ),
          },
          oxygen: {
            value: system.stats.oxygen.value,
            max: system.stats.oxygen.max ?? 100,
            pct: system.stats.oxygen.value,
          },
        };
      } else if (system.hull && system.fuel && system.oxygen) {
        // Fallback for other system versions
        shipStatus = {
          hull: {
            value: system.hull.value,
            max: system.hull.max,
            pct: Math.round((system.hull.value / system.hull.max) * 100),
          },
          fuel: {
            value: system.fuel.value,
            max: system.fuel.max,
            pct: Math.round((system.fuel.value / system.fuel.max) * 100),
          },
          oxygen: {
            value: system.oxygen.value,
            max: system.oxygen.max,
            pct: Math.round((system.oxygen.value / system.oxygen.max) * 100),
          },
        };
      }
    }

    // Check if any hacking games are enabled
    const allTypes = HackingGameRegistry.getTypes();
    const enabledTypes = this._getEnabledTypes(allTypes);
    const hackingEnabled = enabledTypes.length > 0;

    const context = {
      state: this.computerState,
      isController: this.isController,
      canInteract: this.canInteract,
      controllerName: controllerName,
      osVersion: osVersion,
      isLogin: this.computerState.view === "login",
      isHacking: this.computerState.view === "hacking",
      isDesktop: this.computerState.view === "desktop",
      hackingState: this.computerState.hackingState,
      hackingType: this.computerState.hackingType,
      hackingHelpText: this.computerState.hackingType
        ? game.i18n.localize(
            `FVTT-MII.Hacking.Help.${this.computerState.hackingType}`
          )
        : "",
      hackingMessage: this.computerState.hackingMessage,
      hackingResult: this.computerState.hackingResult,
      hackingScore: this.computerState.hackingScore,
      showCamera: this.computerState.activeApp === "camera" && hasCameras,
      showFiles: this.computerState.activeApp === "files" && hasFiles,
      showShip:
        this.computerState.activeApp === "ship" &&
        !!shipStatus &&
        this.hasShipAccess,
      showCLI: this.computerState.activeApp === "cli",
      cliHistory: this.computerState.cliHistory || [],
      activeFileContent: this.computerState.activeFile
        ? this.files[this.computerState.activeFile]
        : null,
      fileList: fileList,
      activeCamera: activeCamera,
      hasFiles: hasFiles,
      hasCameras: hasCameras,
      hasShip: !!shipStatus && this.hasShipAccess,
      hasCLI: true,
      isCLIOnly: this.isCLIOnly,
      shipStatus: shipStatus,
      isGM: game.user.isGM,
      hasCharacter: !!game.user.character,
      canHack: this.computerState.canHack && hackingEnabled,
      hackingScore: this._getHackingBonus(game.user.character),
      links: LINKS,
      crackedPassword: this.computerState.crackedPassword,
    };

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);

    // Attach listeners
    const html = this.element;

    if (this.canInteract) {
      html
        .querySelector("#login-btn")
        ?.addEventListener("click", this._onLogin.bind(this));

      html
        .querySelector("#bypass-btn")
        ?.addEventListener("click", this._startHacking.bind(this));

      html
        .querySelector("#cancel-hack-btn")
        ?.addEventListener("click", this._onCancelHacking.bind(this));

      // Hacking Game Listeners
      // Word Guess (Fallout Style)
      html.querySelectorAll(".hacking-word").forEach((el) => {
        el.addEventListener("click", (ev) => {
          const word = ev.currentTarget.dataset.word;
          this._onHackingAction({ type: "guess", word: word });
        });
      });

      // Signal Injection (Pulse Matching)
      html
        .querySelector("#signal-inject-btn")
        ?.addEventListener("click", () => {
          this._onHackingAction({
            type: "inject",
          });
        });

      // Data Stream (Pipe Connection)
      html.querySelectorAll(".pipe-tile").forEach((el) => {
        el.addEventListener("click", (ev) => {
          const x = parseInt(ev.currentTarget.dataset.x);
          const y = parseInt(ev.currentTarget.dataset.y);
          this._onHackingAction({ type: "rotate", x, y });
        });
      });

      // Node Overload (Minesweeper lol)
      html.querySelectorAll(".node-cell").forEach((el) => {
        el.addEventListener("click", (ev) => {
          const x = parseInt(ev.currentTarget.dataset.x);
          const y = parseInt(ev.currentTarget.dataset.y);
          this._onHackingAction({ type: "reveal", x, y });
        });
      });

      // Brute Force (Just typeing)
      const bruteInput = html.querySelector("#brute-input");
      if (bruteInput) {
        bruteInput.addEventListener("input", (ev) => {
          this._onHackingAction({ type: "type", value: bruteInput.value });
        });
        // Auto-focus
        bruteInput.focus();
      }
      html
        .querySelector("#pattern-ready-btn")
        ?.addEventListener("click", () => {
          this._onHackingAction({ type: "ready" });
        });

      html.querySelectorAll(".pattern-btn").forEach((el) => {
        el.addEventListener("click", (ev) => {
          const val = parseInt(ev.currentTarget.dataset.value);
          this._onHackingAction({ type: "press", value: val });
        });
      });

      // Username Input Listener
      const usernameInput = html.querySelector("#username");
      if (usernameInput) {
        // Restore focus if needed
        if (this.computerState.focusedElement === "username") {
          usernameInput.focus();
          const len = usernameInput.value.length;
          usernameInput.setSelectionRange(len, len);
        }

        usernameInput.addEventListener(
          "input",
          this._onUsernameInput.bind(this)
        );
      }

      // Allow pressing Enter to login
      const loginInputs = html.querySelectorAll("#username, #password");
      loginInputs.forEach((input) => {
        input.addEventListener("keydown", (event) => {
          AudioController.play("KEYPRESS");
          if (event.key === "Enter") {
            this._onLogin(event);
          }
        });
      });

      html
        .querySelector("#camera-icon")
        ?.addEventListener("click", () => this._openApp("camera"));
      html
        .querySelector("#files-icon")
        ?.addEventListener("click", () => this._openApp("files"));
      html
        .querySelector("#ship-icon")
        ?.addEventListener("click", () => this._openApp("ship"));
      html
        .querySelector("#cli-icon")
        ?.addEventListener("click", () => this._openApp("cli"));
      html
        .querySelector("#logout-btn")
        ?.addEventListener("click", this._onLogout.bind(this));

      // CLI Input
      const cliInput = html.querySelector("#cli-input");
      if (cliInput) {
        cliInput.addEventListener("keydown", (event) => {
          AudioController.play("KEYPRESS");
          if (event.key === "Enter") {
            this._handleCLICommand(event.target.value);
          }
        });
        // Auto-focus and scroll to bottom
        setTimeout(() => {
          cliInput.focus();
          const cliOutput = html.querySelector("#cli-output");
          if (cliOutput) {
            cliOutput.scrollTop = cliOutput.scrollHeight;
          }
        }, 10);
      }

      // Camera controls
      html
        .querySelector("#prev-cam")
        ?.addEventListener("click", () => this._changeCamera(-1));
      html
        .querySelector("#next-cam")
        ?.addEventListener("click", () => this._changeCamera(1));

      // File controls
      html.querySelectorAll(".file-link").forEach((el) => {
        el.addEventListener("click", (ev) => {
          const fileId = ev.currentTarget.dataset.file;
          this._openFile(fileId);
        });
      });

      html
        .querySelector("#back-files")
        ?.addEventListener("click", () => this._openFile(null));
    }
  }

  _broadcastState() {
    MoshSocket.emitUpdate(this.computerState);
  }

  _onUsernameInput(event) {
    const username = event.target.value;
    this.computerState.usernameInput = username;
    this.computerState.focusedElement = "username";

    // Check hackability
    const rootFolderName = game.settings.get(
      "mothership-interactive-terminal",
      "rootFolderName"
    );
    const rootFolder = game.folders.find(
      (f) => f.name === rootFolderName && f.type === "JournalEntry"
    );

    let newCanHack = false;
    let newTargetId = null;

    if (rootFolder && username && game.user.character) {
      // Find folder starting with username + ":"
      const userFolder = game.folders.find(
        (f) =>
          f.name.startsWith(username + ":") && f.folder?.id === rootFolder.id
      );
      if (userFolder) {
        const contentsJournal = userFolder.contents.find(
          (j) => j.name === "CONTENTS"
        );
        if (contentsJournal) {
          const isHackable = contentsJournal.pages.contents.some(
            (p) => p.name === "HACKABLE"
          );
          if (isHackable) {
            newCanHack = true;
            newTargetId = contentsJournal.id;
          }
        }
      }
    }

    if (newCanHack !== this.computerState.canHack) {
      this.computerState.canHack = newCanHack;
      this.computerState.hackTargetId = newTargetId;
      this.render();
    }
  }

  async _onLogin(event) {
    event.preventDefault();
    const username = this.element.querySelector("#username").value;
    const password = this.element.querySelector("#password").value;

    const rootFolderName = game.settings.get(
      "mothership-interactive-terminal",
      "rootFolderName"
    );
    const rootFolder = game.folders.find(
      (f) => f.name === rootFolderName && f.type === "JournalEntry"
    );

    if (!rootFolder) {
      ui.notifications.error(
        game.i18n.format("FVTT-MII.Errors.RootFolderNotFound", {
          rootFolderName,
        })
      );
      return;
    }

    const targetFolderName = `${username}:${password}`;
    const targetFolder = game.folders.find(
      (f) => f.name === targetFolderName && f.folder?.id === rootFolder.id
    );

    if (targetFolder) {
      const contentsJournal = targetFolder.contents.find(
        (j) => j.name === "CONTENTS"
      );
      await this._loadUserData(contentsJournal);
      this.computerState.view = "desktop";
      this.computerState.controllerId = game.user.id; // Claim controller seat
      this.computerState.currentUser = username;
      this.computerState.dataSourceId = contentsJournal.id;
      this.computerState.loginError = false;
      this.computerState.cameraIndex = 0;
      this.computerState.activeApp = this.isCLIOnly ? "cli" : null;
      this._broadcastState();
      await this.render();
      this.setPosition({ width: 900, height: 700 });
      AudioController.play("STARTUP");
    } else {
      this.computerState.loginError = true;
      this.render();
      AudioController.play("ERROR");
    }
  }

  async _onLogout() {
    this.computerState.view = "login";
    this.computerState.controllerId = null; // Release controller seat
    this.computerState.currentUser = null;
    this.computerState.dataSourceId = null;
    this.computerState.activeApp = null;
    this.computerState.usernameInput = ""; // Clear username
    this.computerState.canHack = false;
    this.computerState.hackTargetId = null;
    this.computerState.crackedPassword = null;
    this._broadcastState();
    await this.render();
    this.setPosition({ width: 500, height: 450 });
    AudioController.play("CLICK");
  }

  _openApp(appName) {
    this.computerState.activeApp = appName;
    this.computerState.activeFile = null; // Reset file when switching apps
    this._broadcastState();
    this.render();
    AudioController.play("CLICK");
  }

  _openFile(fileId) {
    if (!fileId) {
      this.computerState.activeFile = null;
      this._broadcastState();
      this.render();
      AudioController.play("CLICK");
      return;
    }

    const file = this.files[fileId];
    if (file && file.isMacro) {
      this._executeMacro(file.content);
      return;
    }

    this.computerState.activeFile = fileId;
    this._broadcastState();
    this.render();
    AudioController.play("CLICK");
  }

  async _executeMacro(macroName) {
    if (game.user.isGM) {
      const macro = game.macros.find((m) => m.name === macroName);
      if (macro) {
        try {
          await macro.execute();
          ui.notifications.info(
            game.i18n.format("FVTT-MII.Notifications.MacroExecuted", {
              name: macroName,
            })
          );
          AudioController.play("STARTUP");
        } catch (err) {
          ui.notifications.error(
            game.i18n.format("FVTT-MII.Notifications.MacroError", {
              error: err.message,
            })
          );
          AudioController.play("ERROR");
        }
      } else {
        ui.notifications.warn(
          game.i18n.format("FVTT-MII.Notifications.MacroNotFound", {
            name: macroName,
          })
        );
        AudioController.play("ERROR");
      }
    } else {
      MoshSocket.emitExecuteMacro(macroName);
      ui.notifications.info(
        game.i18n.format("FVTT-MII.Notifications.MacroExecuted", {
          name: macroName,
        })
      );
      AudioController.play("STARTUP");
    }
  }

  _changeCamera(delta) {
    const cameraCount = this.cameras.length;
    let newIndex = this.computerState.cameraIndex + delta;
    if (newIndex < 0) newIndex = cameraCount - 1;
    if (newIndex >= cameraCount) newIndex = 0;

    this.computerState.cameraIndex = newIndex;
    this._broadcastState();
    this.render();
    AudioController.play("CLICK");
  }

  _handleCLICommand(commandStr) {
    const command = commandStr.trim();
    if (!command) return;

    // Add to history
    if (!this.computerState.cliHistory) this.computerState.cliHistory = [];
    this.computerState.cliHistory.push(`&gt; ${command}`);

    const parts = command.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "help":
        this.computerState.cliHistory.push("AVAILABLE COMMANDS:");
        this.computerState.cliHistory.push(
          "  ls            - List files and commands"
        );
        this.computerState.cliHistory.push("  open <file>   - Open a file");
        this.computerState.cliHistory.push("  execute <cmd> - Run a command");
        this.computerState.cliHistory.push("  whoami        - Current user");
        this.computerState.cliHistory.push("  clear         - Clear terminal");
        this.computerState.cliHistory.push("  exit          - Close terminal");
        break;
      case "ls":
        const allItems = Object.values(this.files);
        const fileItems = allItems.filter((f) => !f.isMacro);
        const macroItems = allItems.filter((f) => f.isMacro);

        if (fileItems.length > 0) {
          this.computerState.cliHistory.push("FILES:");
          fileItems.forEach((f) =>
            this.computerState.cliHistory.push(`  ${f.title}`)
          );
        }

        if (macroItems.length > 0) {
          this.computerState.cliHistory.push("COMMANDS:");
          macroItems.forEach((f) =>
            this.computerState.cliHistory.push(`  ${f.title}`)
          );
        }

        if (fileItems.length === 0 && macroItems.length === 0) {
          this.computerState.cliHistory.push("No files or commands found.");
        }
        break;
      case "open":
        const fileName = args.join(" ");
        if (!fileName) {
          this.computerState.cliHistory.push("Usage: open <filename>");
        } else {
          const file = Object.values(this.files).find(
            (f) =>
              f.title.toLowerCase() === fileName.toLowerCase() && !f.isMacro
          );

          if (file) {
            this.computerState.cliHistory.push(`Opening ${file.title}...`);
            this.computerState.cliHistory.push(
              "----------------------------------------"
            );
            if (file.isImage) {
              this.computerState.cliHistory.push(
                `<img src="${file.content}" style="max-width: 100%; border: 1px solid #0f0;">`
              );
            } else {
              this.computerState.cliHistory.push(file.content);
            }
            this.computerState.cliHistory.push(
              "----------------------------------------"
            );
          } else {
            // Check if it's a macro to give a hint
            const macro = Object.values(this.files).find(
              (f) =>
                f.title.toLowerCase() === fileName.toLowerCase() && f.isMacro
            );
            if (macro) {
              this.computerState.cliHistory.push(
                `'${macro.title}' is a command. Use 'execute ${macro.title}' to run it.`
              );
            } else {
              this.computerState.cliHistory.push(`File not found: ${fileName}`);
            }
          }
        }
        break;
      case "execute":
        const cmdName = args.join(" ");
        if (!cmdName) {
          this.computerState.cliHistory.push("Usage: execute <command>");
        } else {
          const macro = Object.values(this.files).find(
            (f) => f.title.toLowerCase() === cmdName.toLowerCase() && f.isMacro
          );
          if (macro) {
            this.computerState.cliHistory.push(
              `Executing command: ${macro.title}...`
            );
            this._executeMacro(macro.content);
          } else {
            this.computerState.cliHistory.push(`Command not found: ${cmdName}`);
          }
        }
        break;
      case "whoami":
        this.computerState.cliHistory.push(this.computerState.currentUser);
        break;
      case "clear":
        this.computerState.cliHistory = [];
        break;
      case "exit":
      case "logout":
        this._onLogout();
        break;
      default:
        this.computerState.cliHistory.push(`Unknown command: ${cmd}`);
    }

    this._broadcastState();
    this.render();
  }

  _getEnabledTypes(allTypes) {
    let enabledTypes = [];
    let hasOverride = false;

    // Check HACKABLE page content for overrides
    if (this.computerState.hackTargetId) {
      const journal = game.journal.get(this.computerState.hackTargetId);
      const hackablePage = journal?.pages.contents.find(
        (p) => p.name === "HACKABLE"
      );

      if (hackablePage && hackablePage.type === "text") {
        // Extract text content
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = hackablePage.text.content;
        const text = (tempDiv.textContent || tempDiv.innerText || "").trim();

        const overrides = ComputerInterface.parseHackableInstructions(
          text,
          allTypes
        );
        if (overrides) {
          enabledTypes = overrides;
          hasOverride = true;
        }
      }
    }

    // Fallback to all games if no override found
    if (!hasOverride) {
      enabledTypes = allTypes;
    }

    return enabledTypes;
  }

  _getHackingBonus(actor) {
    if (!actor) return 0;
    let bonus = 0;

    // Add Intellect stat
    if (actor.system?.stats?.intellect?.value) {
      bonus += actor.system.stats.intellect.value;
    }

    const hasComputers = actor.items.some((i) => i.name === "Computers");
    const hasHacking = actor.items.some((i) => i.name === "Hacking");

    if (hasHacking) bonus += 15;
    else if (hasComputers) bonus += 10;

    return bonus;
  }

  _startHacking() {
    const actor = game.user.character;
    let bonus = this._getHackingBonus(actor);

    // Apply Difficulty Multiplier
    const difficultyMult = game.settings.get(
      "mothership-interactive-terminal",
      "hackingDifficulty"
    );
    bonus = Math.round(bonus * difficultyMult);

    // Randomly select a game type
    const allTypes = HackingGameRegistry.getTypes();
    const enabledTypes = this._getEnabledTypes(allTypes);

    if (enabledTypes.length === 0) {
      ui.notifications.warn(
        game.i18n.localize("FVTT-MII.Notifications.NoMinigamesEnabled")
      );
      return;
    }

    const type = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];

    this.activeGame = HackingGameRegistry.create(type, bonus, this);

    this.computerState.view = "hacking";
    this.computerState.controllerId = game.user.id;
    this.computerState.hackingType = type;
    this.computerState.hackingState = this.activeGame.state;
    this.computerState.hackingScore = bonus;
    this.computerState.hackingMessage = null;
    this.computerState.hackingResult = null;

    this._broadcastState();
    this.render();
    AudioController.play("STARTUP");

    // Start game loop
    this._startHackingLoop();
  }

  _onCancelHacking() {
    this._handleHackingCompletion({
      success: false,
      complete: true,
      message: "ABORTED",
    });
  }

  _startHackingLoop() {
    if (this._hackingInterval) clearInterval(this._hackingInterval);

    this._hackingInterval = setInterval(() => {
      if (this.activeGame && this.computerState.view === "hacking") {
        const changed = this.activeGame.update(100); // 100ms delta

        if (this.computerState.hackingType === "brute-force") {
          this._updateBruteForceTimer();
        } else if (this.computerState.hackingType === "signal-injection") {
          this._updateSignalInjectionVisuals();
        } else if (this.computerState.hackingType === "pattern-buffer") {
          this._updatePatternBufferTimer();
        }

        if (changed) {
          this.computerState.hackingState = this.activeGame.state;
          // Check for loss via timeout
          if (this.activeGame.isLost && !this.computerState.hackingResult) {
            this._handleHackingCompletion({
              success: false,
              complete: true,
              message: "TIMEOUT",
            });
          } else {
            this._broadcastState();
            // Only re-render if it's a game that needs high freq updates (Signal Injection)
            // Or if we want to see the timer tick
            this.render();
          }
        }
      }
    }, 100);
  }

  _updateBruteForceTimer() {
    if (!this.activeGame || !this.activeGame.state) return;
    const { timeLeft, maxTime } = this.activeGame.state;
    const pct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

    if (!this.element) return;

    const bar = this.element.querySelector(".timer-fill");
    if (bar) {
      bar.style.width = `${pct}%`;
      if (pct < 20) {
        bar.parentElement.classList.add("critical");
      }
    }
  }

  _updateSignalInjectionVisuals() {
    if (!this.activeGame || !this.activeGame.state) return;
    const { targetZone } = this.activeGame.state;

    if (!this.element) return;

    const target = this.element.querySelector(".signal-target");
    if (target) {
      target.style.left = `${targetZone.start}%`;
    }
  }

  _updatePatternBufferTimer() {
    if (!this.activeGame || !this.activeGame.state) return;
    const { timeLeft, maxTime, status } = this.activeGame.state;

    if (status !== "displaying") return;

    const pct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

    if (!this.element) return;

    const bar = this.element.querySelector(".timer-fill");
    if (bar) {
      bar.style.width = `${pct}%`;
      if (pct < 20) {
        bar.parentElement.classList.add("critical");
      }
    }
  }

  _stopHackingLoop() {
    if (this._hackingInterval) {
      clearInterval(this._hackingInterval);
      this._hackingInterval = null;
    }
  }

  _onHackingAction(action) {
    if (!this.activeGame) {
      // Restore state if instance is missing
      if (this.computerState.hackingType && this.computerState.hackingState) {
        this.activeGame = HackingGameRegistry.restore(
          this.computerState.hackingType,
          this.computerState.hackingState,
          this
        );
      }
    }

    if (!this.activeGame) return;

    const result = this.activeGame.handleAction(action);

    // Update state from game
    this.computerState.hackingState = this.activeGame.state;

    if (result.complete) {
      this._handleHackingCompletion(result);
    } else {
      this._broadcastState();

      // Skip render on typing to preserve cursor
      if (action.type !== "type") {
        this.render();
      }

      if (action.type !== "hover" && action.type !== "type")
        AudioController.play("CLICK");
      if (action.type === "type") AudioController.play("KEYPRESS");
    }
  }

  _handleHackingCompletion(result) {
    this._stopHackingLoop();

    this.computerState.hackingMessage = result.message;
    this.computerState.hackingResult = result.success ? "success" : "failure";
    this._broadcastState();
    this.render();

    if (result.success) AudioController.play("SUCCESS");
    else AudioController.play("FAIL");

    // Transition delay
    setTimeout(() => {
      if (result.success) {
        this.computerState.view = "desktop";
        this.computerState.controllerId = game.user.id;
        this.computerState.currentUser = "ROOT_OVERRIDE";

        if (this.computerState.hackTargetId) {
          const journal = game.journal.get(this.computerState.hackTargetId);
          if (journal) {
            this._loadUserData(journal);
            this.computerState.dataSourceId = journal.id;

            // Extract password from folder name
            if (journal.folder) {
              const folderName = journal.folder.name; // "Username:Password"
              const parts = folderName.split(":");
              if (parts.length >= 2) {
                this.computerState.crackedPassword = parts[1];
              }
            }
          }
        }

        this.computerState.loginError = false;
        this.computerState.cameraIndex = 0;
        this.computerState.activeApp = this.isCLIOnly ? "cli" : null;
        this.computerState.hackingState = null;
        this.computerState.hackingType = null;
        this.computerState.hackingMessage = null;
        this.computerState.hackingResult = null;
        this.activeGame = null;

        this._broadcastState();
        this.render();
        this.setPosition({ width: 900, height: 700 });
        AudioController.play("STARTUP");
      } else {
        this.computerState.view = "login";
        this.computerState.controllerId = null;
        this.computerState.loginError = true;
        this.computerState.hackingState = null;
        this.computerState.hackingType = null;
        this.computerState.hackingMessage = null;
        this.computerState.hackingResult = null;
        this.activeGame = null;
        this._broadcastState();
        this.render();
        AudioController.play("ERROR");
      }
    }, 2000); // 2 second delay
  }
}
