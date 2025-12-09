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
- **Journal Driven**: All files, access, and options are driven using Journals and Journal Folders.

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

Success grants access to the account and displays the password to make subsequent logins easier.

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

<details>
   <summary>Login</summary>

   | Login | Login with Hacking Enabled |
| --- | --- |
| <img width="511" height="564" alt="image" src="https://github.com/user-attachments/assets/71190eb6-53c0-4449-891d-ec9a8e1d292d" /> | <img width="511" height="564" alt="image" src="https://github.com/user-attachments/assets/3541bc22-8cf8-42e6-ae92-9c183eb3422f" /> |
   
</details>

<details>
   <summary>Journal Structure</summary>

| Journal Folder Structure | Journal Structure |
| --- | --- |
| <img width="296" height="183" alt="image" src="https://github.com/user-attachments/assets/5417e981-d1ef-4e4c-96ec-12fefae974ee" /> | <img width="964" height="806" alt="image" src="https://github.com/user-attachments/assets/a9d4cf19-3709-43db-be2f-97c172e57da6" /> |

</details>

<details>
   <summary>View Types</summary>

| GUI View | CLI View |
| --- | --- |
| <img width="915" height="712" alt="image" src="https://github.com/user-attachments/assets/579f49a6-2081-443d-a4c0-289545c19b35" /> | <img width="915" height="712" alt="image" src="https://github.com/user-attachments/assets/9a381349-636d-43a4-aaf3-641a04634b12" /> |

</details>

<details>
   <summary>Hacking Games</summary>

| Word Guess |
| --- |
| <img width="511" height="461" alt="image" src="https://github.com/user-attachments/assets/31492115-5883-4457-864b-1e0eb76f0564" /> |

| Signal Injection |
| --- |
| <img width="511" height="461" alt="image" src="https://github.com/user-attachments/assets/93af9b78-0012-4429-91a3-e7fb8742c115" /> |

| Data Stream |
| --- |
| <img width="519" height="527" alt="image" src="https://github.com/user-attachments/assets/93e20e3d-d08d-4b2d-bebe-79a7bd06466a" /> |

| Node Overload |
| --- |
| <img width="519" height="527" alt="image" src="https://github.com/user-attachments/assets/a54878c6-eee3-4d9a-ba5c-e6911b35a211" /> |

| Brute Force |
| --- |
| <img width="519" height="527" alt="image" src="https://github.com/user-attachments/assets/5083532d-d172-421a-9b47-6958cb3fd53e" /> |

| Pattern Buffer Prep | Pattern Buffer |
| --- | --- |
| <img width="511" height="461" alt="image" src="https://github.com/user-attachments/assets/79238202-6fe7-485e-91b0-0f476d8a6d79" /> | <img width="511" height="461" alt="image" src="https://github.com/user-attachments/assets/a1182e62-0492-4df1-ad81-5753ed3fa25e" /> |

</details>

## Licenses

All current SFX are CC0
