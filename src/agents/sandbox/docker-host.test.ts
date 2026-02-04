import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDockerHostAddress } from "./docker-host.js";

describe("resolveDockerHostAddress", () => {
  const originalEnv = process.env.OPENCLAW_DOCKER_HOST;

  beforeEach(() => {
    delete process.env.OPENCLAW_DOCKER_HOST;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.OPENCLAW_DOCKER_HOST;
    } else {
      process.env.OPENCLAW_DOCKER_HOST = originalEnv;
    }
    vi.unstubAllGlobals();
  });

  it("returns env var when OPENCLAW_DOCKER_HOST is set", () => {
    process.env.OPENCLAW_DOCKER_HOST = "10.0.2.2";
    expect(resolveDockerHostAddress()).toBe("10.0.2.2");
  });

  it("env var takes precedence over config value", () => {
    process.env.OPENCLAW_DOCKER_HOST = "10.0.2.2";
    expect(resolveDockerHostAddress("192.168.1.1")).toBe("10.0.2.2");
  });

  it("returns config value when no env var is set", () => {
    expect(resolveDockerHostAddress("192.168.1.1")).toBe("192.168.1.1");
  });

  it("trims whitespace from env var", () => {
    process.env.OPENCLAW_DOCKER_HOST = "  10.0.2.2  ";
    expect(resolveDockerHostAddress()).toBe("10.0.2.2");
  });

  it("trims whitespace from config value", () => {
    expect(resolveDockerHostAddress("  192.168.1.1  ")).toBe("192.168.1.1");
  });

  it("wraps IPv6 addresses in brackets", () => {
    process.env.OPENCLAW_DOCKER_HOST = "::1";
    expect(resolveDockerHostAddress()).toBe("[::1]");
  });

  it("does not double-wrap IPv6 addresses already in brackets", () => {
    process.env.OPENCLAW_DOCKER_HOST = "[::1]";
    expect(resolveDockerHostAddress()).toBe("[::1]");
  });

  it("returns host.docker.internal on darwin when no override", () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("darwin");
    // Re-import to pick up mocked platform
    const { resolveDockerHostAddress: resolve } = require("./docker-host.js");
    expect(resolve()).toBe("host.docker.internal");
  });

  it("returns host.docker.internal on win32 when no override", () => {
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("win32");
    const { resolveDockerHostAddress: resolve } = require("./docker-host.js");
    expect(resolve()).toBe("host.docker.internal");
  });

  it("returns 172.17.0.1 on linux when no override", () => {
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("linux");
    const { resolveDockerHostAddress: resolve } = require("./docker-host.js");
    expect(resolve()).toBe("172.17.0.1");
  });

  it("ignores empty env var", () => {
    process.env.OPENCLAW_DOCKER_HOST = "   ";
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("linux");
    const { resolveDockerHostAddress: resolve } = require("./docker-host.js");
    expect(resolve()).toBe("172.17.0.1");
  });

  it("ignores empty config value", () => {
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("linux");
    const { resolveDockerHostAddress: resolve } = require("./docker-host.js");
    expect(resolve("   ")).toBe("172.17.0.1");
  });
});
