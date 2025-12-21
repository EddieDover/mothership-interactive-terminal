import { beforeAll, describe, expect, it, vi } from "vitest";

// Mock global foundry object before import
global.foundry = {
  applications: {
    api: {
      ApplicationV2: class {},
      HandlebarsApplicationMixin: (cls) => cls,
    },
  },
};

global.game = {
  settings: {
    get: vi.fn(),
  },
  i18n: {
    localize: (key) => key,
  },
  users: {
    get: vi.fn(),
  },
  actors: {
    find: vi.fn(),
  },
};

global.Hooks = {
  on: vi.fn(),
};

// Mock dependencies
vi.mock("../src/scripts/audio.js", () => ({
  AudioController: { play: vi.fn() },
}));
vi.mock("../src/scripts/constants.js", () => ({
  LINKS: {},
}));
vi.mock("../src/scripts/hacking/HackingGameRegistry.js", () => ({
  HackingGameRegistry: {
    restore: vi.fn(),
    getTypes: () => ["game1", "game2", "game3"],
  },
}));
vi.mock("../src/scripts/socket.js", () => ({
  MoshSocket: { emitRequestState: vi.fn() },
}));

describe("ComputerInterface.parseHackableInstructions", () => {
  let ComputerInterface;

  beforeAll(async () => {
    // Import the class under test dynamically to ensure globals are set
    const module = await import("../src/scripts/apps/ComputerInterface.js");
    ComputerInterface = module.ComputerInterface;
  });

  const allTypes = ["game1", "game2", "game3"];

  it("should return null for empty input", () => {
    expect(
      ComputerInterface.parseHackableInstructions("", allTypes)
    ).toBeNull();
    expect(
      ComputerInterface.parseHackableInstructions(null, allTypes)
    ).toBeNull();
    expect(
      ComputerInterface.parseHackableInstructions("   ", allTypes)
    ).toBeNull();
  });

  it("should return all types when 'all' is present", () => {
    expect(
      ComputerInterface.parseHackableInstructions("all", allTypes)
    ).toEqual(allTypes);
    expect(
      ComputerInterface.parseHackableInstructions("foo all bar", allTypes)
    ).toEqual(allTypes);
    expect(
      ComputerInterface.parseHackableInstructions("ALL", allTypes)
    ).toEqual(allTypes);
  });

  it("should return specific types when listed", () => {
    expect(
      ComputerInterface.parseHackableInstructions("game1", allTypes)
    ).toEqual(["game1"]);
    expect(
      ComputerInterface.parseHackableInstructions("game1, game3", allTypes)
    ).toEqual(["game1", "game3"]);
    expect(
      ComputerInterface.parseHackableInstructions("game2 game3", allTypes)
    ).toEqual(["game2", "game3"]);
  });

  it("should ignore invalid types", () => {
    expect(
      ComputerInterface.parseHackableInstructions("game1, invalid", allTypes)
    ).toEqual(["game1"]);
  });

  it("should return null if no valid types found", () => {
    expect(
      ComputerInterface.parseHackableInstructions("invalid, other", allTypes)
    ).toBeNull();
  });
});
