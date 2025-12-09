import { ComputerInterface } from "./apps/ComputerInterface.js";
import { HackingGameRegistry } from "./hacking/HackingGameRegistry.js";
import { MoshSocket } from "./socket.js";

Hooks.once("init", () => {
  console.log("FVTT-MII | Initializing");

  // Register Handlebars Helpers
  Handlebars.registerHelper("pct", function (value, max) {
    if (!max) return 0;
    return Math.round((value / max) * 100);
  });

  // Register settings
  game.settings.register("mothership-interactive-terminal", "rootFolderName", {
    name: "FVTT-MII.Settings.RootFolderName.Name",
    hint: "FVTT-MII.Settings.RootFolderName.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "MOSH TERMINAL",
  });

  game.settings.register("mothership-interactive-terminal", "interfaceTitle", {
    name: "FVTT-MII.Settings.InterfaceTitle.Name",
    hint: "FVTT-MII.Settings.InterfaceTitle.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "MOSH TERMINAL",
  });

  game.settings.register("mothership-interactive-terminal", "osVersion", {
    name: "FVTT-MII.Settings.OSVersion.Name",
    hint: "FVTT-MII.Settings.OSVersion.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "_FVTT-MII OS v1.0",
  });

  game.settings.register("mothership-interactive-terminal", "enableAudio", {
    name: "FVTT-MII.Settings.EnableAudio.Name",
    hint: "FVTT-MII.Settings.EnableAudio.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(
    "mothership-interactive-terminal",
    "hackingDifficulty",
    {
      name: "FVTT-MII.Settings.HackingDifficulty.Name",
      hint: "FVTT-MII.Settings.HackingDifficulty.Hint",
      scope: "world",
      config: true,
      type: Number,
      default: 1.0,
      range: {
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
    }
  );

  // Minigame Toggle Settings
  const gameTypes = HackingGameRegistry.getTypes();
  gameTypes.forEach((type) => {
    game.settings.register(
      "mothership-interactive-terminal",
      `enableGame-${type}`,
      {
        name: `FVTT-MII.Settings.EnableGame.${type}.Name`,
        hint: `FVTT-MII.Settings.EnableGame.${type}.Hint`,
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      }
    );
  });

  // Audio File Settings
  const sounds = ["startup", "keypress", "click", "error", "success", "fail"];
  sounds.forEach((sound) => {
    game.settings.register(
      "mothership-interactive-terminal",
      `sound${sound.charAt(0).toUpperCase() + sound.slice(1)}`,
      {
        name: `FVTT-MII.Settings.Sound${sound.charAt(0).toUpperCase() + sound.slice(1)}.Name`,
        hint: `FVTT-MII.Settings.Sound${sound.charAt(0).toUpperCase() + sound.slice(1)}.Hint`,
        scope: "world",
        config: true,
        type: String,
        default: `modules/mothership-interactive-terminal/sounds/${sound}.ogg`,
        filePicker: "audio",
      }
    );
  });

  game.settings.register(
    "mothership-interactive-terminal",
    "activeController",
    {
      name: "FVTT-MII.Settings.ActiveController.Name",
      scope: "world",
      config: false,
      type: String,
      default: "",
    }
  );
});

Hooks.once("ready", () => {
  MoshSocket.init();
});

Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControls = controls.tokens;

  if (tokenControls) {
    const button = {
      name: "mosh-computer",
      title: "FVTT-MII.Interface.OpenComputerInterface",
      icon: "fas fa-desktop",
      onChange: () => {
        ComputerInterface.show();
      },
      button: true,
    };
    tokenControls.tools["mosh-computer"] = button;
  }
});
