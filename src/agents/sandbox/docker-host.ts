import os from "node:os";

/**
 * Resolves the host address that containers can use to reach the host machine.
 *
 * Precedence:
 * 1. Config file value (persistent user configuration)
 * 2. Platform auto-detection (default behavior)
 *
 * Common values for non-standard setups:
 * - Rootless Docker: 10.0.2.2
 * - Podman: 10.0.2.2
 * - Colima: host.lima.internal
 * - Custom bridge: your bridge gateway IP
 */
export function resolveContainerHostAddress(configValue?: string): string {
  // 1. Config file value (persistent configuration)
  if (configValue?.trim()) {
    return normalizeHostAddress(configValue);
  }

  // 2. Platform auto-detection (default behavior)
  const platform = os.platform();
  if (platform === "darwin" || platform === "win32") {
    // Docker Desktop provides host.docker.internal
    return "host.docker.internal";
  }

  // Linux: Default Docker bridge gateway.
  // Override with config for:
  // - Rootless Docker (typically 10.0.2.2)
  // - Custom bridge networks
  // - Podman (typically 10.0.2.2)
  // - Docker-in-Docker setups
  return "172.17.0.1";
}

/**
 * Normalizes a host address for use in URLs.
 * - Trims whitespace
 * - Wraps IPv6 addresses in brackets if needed
 */
function normalizeHostAddress(host: string): string {
  const trimmed = host.trim();
  // IPv6 address without brackets needs wrapping for URL compatibility
  if (trimmed.includes(":") && !trimmed.startsWith("[")) {
    return `[${trimmed}]`;
  }
  return trimmed;
}
