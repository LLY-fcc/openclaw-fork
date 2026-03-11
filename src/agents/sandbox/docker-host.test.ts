import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveContainerHostAddress } from "./docker-host.js";

describe("resolveContainerHostAddress", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns config value when provided", () => {
    expect(resolveContainerHostAddress("192.168.1.1")).toBe("192.168.1.1");
  });

  it("trims whitespace from config value", () => {
    expect(resolveContainerHostAddress("  192.168.1.1  ")).toBe("192.168.1.1");
  });

  it("wraps IPv6 addresses in brackets", () => {
    expect(resolveContainerHostAddress("::1")).toBe("[::1]");
  });

  it("does not double-wrap IPv6 addresses already in brackets", () => {
    expect(resolveContainerHostAddress("[::1]")).toBe("[::1]");
  });

  it("returns host.docker.internal on darwin when no override", () => {
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("darwin");
    expect(resolveContainerHostAddress()).toBe("host.docker.internal");
  });

  it("returns host.docker.internal on win32 when no override", () => {
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("win32");
    expect(resolveContainerHostAddress()).toBe("host.docker.internal");
  });

  it("returns 172.17.0.1 on linux when no override", () => {
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("linux");
    expect(resolveContainerHostAddress()).toBe("172.17.0.1");
  });

  it("ignores empty config value", () => {
    const os = require("node:os");
    vi.spyOn(os, "platform").mockReturnValue("linux");
    expect(resolveContainerHostAddress("   ")).toBe("172.17.0.1");
  });
});
