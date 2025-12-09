import { ComputerInterface } from "./apps/ComputerInterface.js";

export class MoshSocket {
  static SOCKET_NAME = "module.mothership-interactive-terminal";

  static init() {
    game.socket.on(this.SOCKET_NAME, (data) => {
      if (data.type === "updateState") {
        ComputerInterface.receiveUpdate(data.payload);
      } else if (data.type === "requestState") {
        ComputerInterface.handleStateRequest();
      } else if (data.type === "executeMacro" && game.user.isGM) {
        MoshSocket.handleMacroExecution(data.payload);
      }
    });
  }

  static async handleMacroExecution(payload) {
    const macro = game.macros.find((m) => m.name === payload.macroName);
    if (macro) {
      macro.execute();
    } else {
      ui.notifications.warn(
        `Mosh Interface: Macro "${payload.macroName}" not found.`
      );
    }
  }

  static emitUpdate(payload) {
    game.socket.emit(this.SOCKET_NAME, {
      type: "updateState",
      payload,
    });
  }

  static emitRequestState() {
    game.socket.emit(this.SOCKET_NAME, {
      type: "requestState",
    });
  }

  static emitExecuteMacro(macroName) {
    game.socket.emit(this.SOCKET_NAME, {
      type: "executeMacro",
      payload: { macroName },
    });
  }
}
