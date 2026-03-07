import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * Webhook endpoint: POST /api/webhooks/{webhookId}
 *
 * Accepts JSON payloads from external services. Looks up the webhook by ID,
 * validates it exists and is enabled, then activates the trigger.
 */
http.route({
  pathPrefix: "/api/webhooks/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const webhookId = url.pathname.replace("/api/webhooks/", "").split("/")[0];

    if (!webhookId) {
      return new Response(JSON.stringify({ error: "Missing webhook ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body: Record<string, any> = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Look up trigger by webhookId
    const trigger = await ctx.runQuery(api.triggers.getTriggerByWebhookId, { webhookId });

    if (!trigger) {
      return new Response(JSON.stringify({ error: "Webhook not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!trigger.enabled) {
      return new Response(JSON.stringify({ error: "Webhook is disabled" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const timestamp = new Date().toISOString();
    const payload = {
      body,
      timestamp,
      triggerType: "webhook",
      webhookId,
      metadata: {
        headers: Object.fromEntries(request.headers as any),
        method: "POST",
      },
    };

    const executionId = await ctx.runMutation(api.triggers.activateTrigger, {
      triggerId: trigger._id.toString(),
      payload,
    });

    return new Response(
      JSON.stringify({ success: true, executionId: executionId.toString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

/**
 * HTTP trigger endpoint: GET|POST /api/workflows/{workflowId}/trigger
 *
 * Triggers a workflow directly via HTTP request.
 */
http.route({
  pathPrefix: "/api/workflows/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    // /api/workflows/{workflowId}/trigger
    const triggerIdx = parts.indexOf("trigger");
    const workflowId = triggerIdx > 0 ? parts[triggerIdx - 1] : null;

    if (!workflowId || !url.pathname.endsWith("/trigger")) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body: Record<string, any> = {};
    try {
      body = await request.json();
    } catch {
      // body is optional for POST
    }

    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      triggerType: "httpRequest",
      body,
      metadata: { method: "POST" },
    };

    const triggers = await ctx.runQuery(api.triggers.getTriggersByWorkflow, { workflowId });
    const httpTrigger = triggers.find(
      (t: any) => t.type === "httpRequest" && t.enabled
    );

    if (!httpTrigger) {
      return new Response(JSON.stringify({ error: "No active HTTP trigger for this workflow" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const executionId = await ctx.runMutation(api.triggers.activateTrigger, {
      triggerId: httpTrigger._id.toString(),
      payload,
    });

    return new Response(
      JSON.stringify({ success: true, executionId: executionId.toString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

http.route({
  pathPrefix: "/api/workflows/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const triggerIdx = parts.indexOf("trigger");
    const workflowId = triggerIdx > 0 ? parts[triggerIdx - 1] : null;

    if (!workflowId || !url.pathname.endsWith("/trigger")) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      triggerType: "httpRequest",
      query,
      metadata: { method: "GET" },
    };

    const triggers = await ctx.runQuery(api.triggers.getTriggersByWorkflow, { workflowId });
    const httpTrigger = triggers.find(
      (t: any) => t.type === "httpRequest" && t.enabled && t.httpMethod === "GET"
    );

    if (!httpTrigger) {
      return new Response(JSON.stringify({ error: "No active HTTP trigger for this workflow" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const executionId = await ctx.runMutation(api.triggers.activateTrigger, {
      triggerId: httpTrigger._id.toString(),
      payload,
    });

    return new Response(
      JSON.stringify({ success: true, executionId: executionId.toString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;
