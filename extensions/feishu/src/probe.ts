import { createFeishuClient, type FeishuClientCredentials } from "./client.js";
import type { FeishuProbeResult } from "./types.js";

// Cache bot info to reduce API calls for health probes.
// Feishu free tier has a strict monthly quota (10,000 calls).
const botInfoCache = new Map<string, { botName?: string; botOpenId?: string }>();

export async function probeFeishu(creds?: FeishuClientCredentials): Promise<FeishuProbeResult> {
  if (!creds?.appId || !creds?.appSecret) {
    return {
      ok: false,
      error: "missing credentials (appId, appSecret)",
    };
  }

  const cached = botInfoCache.get(creds.appId);

  try {
    const client = createFeishuClient(creds);

    // If we have cached bot info, try to validate connectivity by getting a token.
    // Tenant access token refresh is quota-exempt on Feishu.
    if (cached) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK internal access
        await (client as any).tokenManager.getTenantAccessToken();
        return {
          ok: true,
          appId: creds.appId,
          botName: cached.botName,
          botOpenId: cached.botOpenId,
        };
      } catch (tokenErr) {
        // Fall through to full probe if token check fails
      }
    }

    // Use bot/v3/info API to get bot information
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic request method
    const response = await (client as any).request({
      method: "GET",
      url: "/open-apis/bot/v3/info",
      data: {},
    });

    if (response.code !== 0) {
      return {
        ok: false,
        appId: creds.appId,
        error: `API error: ${response.msg || `code ${response.code}`}`,
      };
    }

    const bot = response.bot || response.data?.bot;
    const result = {
      ok: true,
      appId: creds.appId,
      botName: bot?.bot_name,
      botOpenId: bot?.open_id,
    };

    // Cache the successful result
    botInfoCache.set(creds.appId, {
      botName: result.botName,
      botOpenId: result.botOpenId,
    });

    return result;
  } catch (err) {
    return {
      ok: false,
      appId: creds.appId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
