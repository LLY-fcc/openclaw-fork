import os from "node:os";

/**
 * Resolves the host address that Docker containers can use to reach the host machine.
 *
 * Precedence:
 * 1. OPENCLAW_DOCKER_HOST env var (for CI/CD, temporary overrides)
 * 2. Config file value (persistent user configuration)
 * 3. Platform auto-detection (default behavior)
 *
 * Common values for non-standard setups:
 * - Rootless Docker: 10.0.2.2
 * - Podman: 10.0.2.2
 * - Colima: host.lima.internal
 * - Custom bridge: your bridge gateway IP
 */
export function resolveDockerHostAddress(configValue?: string): string {
  // 1. Environment variable has highest priority (CI/CD, temporary debugging)
  const envOverride = process.env.OPENCLAW_DOCKER_HOST?.trim();
  if (envOverride) {
    return normalizeHostAddress(envOverride);
  }

  // 2. Config file value (persistent configuration)
  if (configValue?.trim()) {
    return normalizeHostAddress(configValue);
  }

  // 3. Platform auto-detection (default behavior)
  const platform = os.platform();
  if (platform === "darwin" || platform === "win32") {
    // Docker Desktop provides host.docker.internal
    return "host.docker.internal";
  }

  // Linux: Default Docker bridge gateway.
  // Override with OPENCLAW_DOCKER_HOST or config for:
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
