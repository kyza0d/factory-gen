"use client";

import React, { useState } from "react";
import { Input, Select } from "ui-lab-components";
import { FaCopy, FaCheck } from "react-icons/fa6";

const DEPLOYMENT_URL =
  (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(".convex.cloud", ".convex.site") ||
  "https://{deployment}.convex.site";

interface TriggerNodeConfigProps {
  triggerType: "webhook" | "cron" | "fileChange" | "httpRequest";
  trigger?: Record<string, any> | null;
  workflowId: string;
  nodeId: string;
  onTypeChange: (newType: string) => void;
  onConfigChange: (config: Record<string, any>) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 p-1 text-foreground-400 hover:text-foreground-200 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <FaCheck className="w-3 h-3 text-success-500" /> : <FaCopy className="w-3 h-3" />}
    </button>
  );
}

function ReadonlyUrlField({ url }: { url: string }) {
  return (
    <div className="flex items-center mt-1">
      <input
        readOnly
        value={url}
        className="flex-1 text-xs bg-background-700 border border-background-600 rounded px-2 py-1 text-foreground-300 min-w-0"
      />
      <CopyButton text={url} />
    </div>
  );
}

function WebhookConfig({
  trigger,
  onConfigChange,
}: {
  trigger?: Record<string, any> | null;
  onConfigChange: (config: Record<string, any>) => void;
}) {
  const webhookId = trigger?.webhookId ?? null;
  const webhookUrl = webhookId
    ? `${DEPLOYMENT_URL}/api/webhooks/${webhookId}`
    : "URL will appear after saving";

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-xs font-semibold block text-foreground-400">Webhook URL</label>
        <ReadonlyUrlField url={webhookUrl} />
      </div>
      <div>
        <label className="text-xs font-semibold block text-foreground-400">Webhook Secret</label>
        <Input
          type="text"
          defaultValue={trigger?.webhookSecret ?? ""}
          placeholder="Optional secret"
          onBlur={(e) => onConfigChange({ webhookSecret: e.target.value })}
        />
      </div>
    </div>
  );
}

function describeCron(expr: string): string {
  if (!expr.trim()) return "";
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid expression (need 5 fields)";

  const [min, hour, dom, month, dow] = parts;

  if (expr === "* * * * *") return "Every minute";
  if (min.startsWith("*/") && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    const n = parseInt(min.slice(2));
    if (!isNaN(n)) return `Every ${n} minute${n !== 1 ? "s" : ""}`;
  }
  if (min !== "*" && hour.startsWith("*/") && dom === "*" && month === "*" && dow === "*") {
    const n = parseInt(hour.slice(2));
    if (!isNaN(n)) return `Every ${n} hour${n !== 1 ? "s" : ""} at minute ${min}`;
  }
  if (min !== "*" && hour !== "*" && dom === "*" && month === "*" && dow === "*") {
    return `Daily at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  }
  if (min !== "*" && hour !== "*" && dom !== "*" && month === "*" && dow === "*") {
    return `Monthly on day ${dom} at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  }
  if (min !== "*" && hour !== "*" && dom === "*" && month === "*" && dow !== "*") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = days[parseInt(dow)] ?? dow;
    return `Weekly on ${dayName} at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  }
  return `Custom schedule: ${expr}`;
}

function CronConfig({
  trigger,
  onConfigChange,
}: {
  trigger?: Record<string, any> | null;
  onConfigChange: (config: Record<string, any>) => void;
}) {
  const [expr, setExpr] = useState(trigger?.cronExpression ?? "");
  const description = describeCron(expr);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-xs font-semibold block text-foreground-400">Schedule</label>
        <Input
          type="text"
          defaultValue={expr}
          placeholder="0 9 * * *"
          onChange={(e) => setExpr(e.target.value)}
          onBlur={(e) => onConfigChange({ cronExpression: e.target.value })}
        />
        {expr && (
          <p className="text-xs text-foreground-400 mt-1 italic">{description}</p>
        )}
      </div>
      <div>
        <label className="text-xs font-semibold block text-foreground-400">Timezone</label>
        <Input
          type="text"
          defaultValue={trigger?.timezone ?? "UTC"}
          placeholder="UTC"
          onBlur={(e) => onConfigChange({ timezone: e.target.value })}
        />
      </div>
    </div>
  );
}

const CHANGE_TYPES = ["created", "modified", "deleted", "all"];

function FileChangeConfig({
  trigger,
  onConfigChange,
}: {
  trigger?: Record<string, any> | null;
  onConfigChange: (config: Record<string, any>) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-xs font-semibold block text-foreground-400">Watch Path</label>
        <Input
          type="text"
          defaultValue={trigger?.watchPath ?? ""}
          placeholder="/home/user/uploads"
          onBlur={(e) => onConfigChange({ watchPath: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs font-semibold block text-foreground-400">File Pattern</label>
        <Input
          type="text"
          defaultValue={trigger?.filePattern ?? "*"}
          placeholder="*.csv"
          onBlur={(e) => onConfigChange({ filePattern: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs font-semibold block text-foreground-400">Change Type</label>
        <Select
          defaultSelectedKey={trigger?.changeType ?? "all"}
          valueLabel={trigger?.changeType ?? "all"}
          onSelectionChange={(key) => onConfigChange({ changeType: key as string })}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select change type" className="rounded-xl!" />
          </Select.Trigger>
          <Select.Content>
            {CHANGE_TYPES.map((t) => (
              <Select.Item key={t} value={t}>{t}</Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    </div>
  );
}

const HTTP_METHODS = ["GET", "POST"];

function HttpRequestConfig({
  trigger,
  workflowId,
  onConfigChange,
}: {
  trigger?: Record<string, any> | null;
  workflowId: string;
  onConfigChange: (config: Record<string, any>) => void;
}) {
  const method = trigger?.httpMethod ?? "POST";
  const triggerUrl = `${DEPLOYMENT_URL}/api/workflows/${workflowId}/trigger`;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-xs font-semibold block text-foreground-400">HTTP Method</label>
        <Select
          defaultSelectedKey={method}
          valueLabel={method}
          onSelectionChange={(key) => onConfigChange({ httpMethod: key as string })}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select method" className="rounded-xl!" />
          </Select.Trigger>
          <Select.Content>
            {HTTP_METHODS.map((m) => (
              <Select.Item key={m} value={m}>{m}</Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold block text-foreground-400">Trigger URL</label>
        <ReadonlyUrlField url={triggerUrl} />
      </div>
      {method === "GET" && (
        <p className="text-xs text-foreground-400 italic">Query parameters will be passed as payload.</p>
      )}
      {method === "POST" && (
        <p className="text-xs text-foreground-400 italic">Request body will be passed as payload.</p>
      )}
    </div>
  );
}

const TRIGGER_TYPES = ["webhook", "cron", "fileChange", "httpRequest"];

export function TriggerNodeConfig({
  triggerType,
  trigger,
  workflowId,
  onTypeChange,
  onConfigChange,
}: TriggerNodeConfigProps) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <label className="text-xs font-semibold block mb-1">Trigger Type</label>
        <Select
          defaultSelectedKey={triggerType}
          valueLabel={triggerType}
          onSelectionChange={(key) => onTypeChange(key as string)}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select trigger type" className="rounded-xl!" />
          </Select.Trigger>
          <Select.Content>
            {TRIGGER_TYPES.map((t) => (
              <Select.Item key={t} value={t}>{t}</Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {triggerType === "webhook" && (
        <WebhookConfig trigger={trigger} onConfigChange={onConfigChange} />
      )}
      {triggerType === "cron" && (
        <CronConfig trigger={trigger} onConfigChange={onConfigChange} />
      )}
      {triggerType === "fileChange" && (
        <FileChangeConfig trigger={trigger} onConfigChange={onConfigChange} />
      )}
      {triggerType === "httpRequest" && (
        <HttpRequestConfig trigger={trigger} workflowId={workflowId} onConfigChange={onConfigChange} />
      )}
    </div>
  );
}
