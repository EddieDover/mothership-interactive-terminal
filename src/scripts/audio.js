export class AudioController {
  static getSoundPath(soundKey) {
    // Map keys to setting names
    const settingMap = {
      STARTUP: "soundStartup",
      KEYPRESS: "soundKeypress",
      CLICK: "soundClick",
      ERROR: "soundError",
      SUCCESS: "soundSuccess",
      FAIL: "soundFail",
    };

    const settingName = settingMap[soundKey];
    if (!settingName) return null;

    return game.settings.get("mothership-interactive-terminal", settingName);
  }

  static async play(soundKey) {
    if (!game.settings.get("mothership-interactive-terminal", "enableAudio"))
      return;

    const src = this.getSoundPath(soundKey);
    if (!src) return;

    await foundry.audio.AudioHelper.play(
      { src, volume: 0.5, autoplay: true, loop: false, channel: "interface" },
      false
    );
  }
}
