# Mothership Interactive Terminal

An immersive, synchronized computer terminal for Mothership RPG in Foundry VTT. Features 6 interactive hacking minigames, file system exploration, camera feeds, and ship status monitoring.

## Requirements:

This module requires one of the following Mothership Systems for FoundryVTT:

- MOSH
- Mothership-fr

## Features

- **Login Screen**: Requires a username and password to access.
- **Synchronized State**: One player drives the interface (the controller), while others watch in real-time. Controller is determined by who logs in first.
- **Camera & File System**: Give your players access to a faux-camera system and filesystem with which to gather lore and mission information.
- **Macro Activation**: Create 'commands' the players can execute to fire off macros you've created.
- **Ship Status Monitor**: View real-time Hull, Fuel, and Oxygen levels for your ship (requires specific access).

### Localized For

- English
- Spanish
- French

## Configuration & Usage

1. Create a Journal **Folder** matching the expected title in the module settings. The default is `MOSH TERMINAL`.
2. Create one or more Journal **Folders** inside of the above folder named using the format `username`:`password`.
3. Create a **Journal** inside the above folder titled `CONTENTS`
4. Create as many pages in the `CONTENTS` Journal as you wish of the following types:
   - To create _Browsable Files_ make a **Text** or **Image** journal entry. The name of the page will be the name of the file in the filesystem browser. You may use standard text or fancy markdown using the Foundry Editor. It will render properly for the players.

   - To create _CAM Footage_ make an **Image** journal entry with the title `CAM: <CameraName`, like `CAM: Bridge`.

   - To enable the **Ship Status Monitor**, create a **Text** page titled `SHIPSTATUS` inside the `CONTENTS` Journal. The content of this page must be the exact name of the Ship Actor you want to monitor.

   - To create **Executable Macros**, create a **Text** page inside the `CONTENTS` journal with a title starting with `MACRO:`, e.g., `MACRO: Self Destruct`. The content of the page should be the exact name of the Macro in your Foundry world that you want to execute.

   - To make an account **Hackable**, create a page titled `HACKABLE` inside the `CONTENTS` Journal. This will allow players to attempt to bypass the password using a minigame. The difficulty of the minigame is based on the hacking actor's **Intellect** + **Computers (+10)** OR **Hacking (+15)**. This total bonus can be scaled globally using the "Hacking Difficulty Multiplier" in the module settings.

   - To enable **CLI Only Mode** for an account (no GUI icons), create a page titled `CLI` inside the inside the `CONTENTS` Journal.

## Hacking Minigames

When a player attempts to bypass a login for a hackable account, they will be presented with one of the following minigames. The GM can enable or disable specific minigames in the module settings to fit the tone of their campaign.

1.  **Word Guess**: A "Fallout-style" terminal game where you must guess the correct password from a list of words based on likeness.
2.  **Signal Injection**: A timing game where you must inject a signal into a moving target zone.
3.  **Data Stream**: A pipe-mania style puzzle where you must rotate tiles to connect a data stream from start to finish.
4.  **Node Overload**: A "Minesweeper-style" game where you must reveal safe nodes without triggering a security mine.
5.  **Brute Force**: A typing speed game where you must type the hex code displayed on screen before time runs out.
6.  **Pattern Buffer**: A "Simon Says" memory game where you must repeat a sequence of inputs.

Success grants access to the account. Failure may trigger alarms or lockout (visual/audio feedback).

## CLI Commands

The terminal includes a functional Command Line Interface (CLI). Available commands:

- `help`: List available commands.
- `ls`: List files and available macros.
- `open <filename>`: Open a text or image file.
- `execute <command>`: Run a macro command.
- `whoami`: Display current user.
- `clear`: Clear the terminal output.
- `logout` / `exit`: Log out of the system.

## Screenshots

TBA

## Licenses

All current SFX are CC0
