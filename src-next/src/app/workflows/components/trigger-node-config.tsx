"use client";

import React, { useState } from "react";
import { Input, Select, Button } from "ui-lab-components";
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
    <Button
      variant="ghost"
      size="sm"
      onPress={handleCopy}
      styles={{ root: "ml-1 p-1" }}
      title="Copy to clipboard"
    >
      {copied ? <FaCheck className="w-3 h-3 text-success-500" /> : <FaCopy className="w-3 h-3" />}
    </Button>
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

type Frequency = "minutely" | "hourly" | "daily" | "weekly" | "monthly";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function detectFrequencyFromCron(expr: string): Frequency {
  if (!expr.trim()) return "daily";
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "daily";

  const [min, hour, dom, month, dow] = parts;

  // Minutely: */X * * * *
  if (min.startsWith("*/") && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return "minutely";
  }

  // Hourly: M */X * * *
  if (min !== "*" && hour.startsWith("*/") && dom === "*" && month === "*" && dow === "*") {
    return "hourly";
  }

  // Weekly: M H * * D
  if (min !== "*" && hour !== "*" && dom === "*" && month === "*" && dow !== "*") {
    return "weekly";
  }

  // Monthly: M H D * *
  if (min !== "*" && hour !== "*" && dom !== "*" && month === "*" && dow === "*") {
    return "monthly";
  }

  // Default to daily
  return "daily";
}

function extractValuesFromCron(expr: string): {
  minuteValue: number;
  hourValue: number;
  dayOfMonth: number;
  dayOfWeek: string;
  frequencyValue: number;
} {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { minuteValue: 0, hourValue: 9, dayOfMonth: 1, dayOfWeek: "0", frequencyValue: 1 };
  }

  const [min, hour, dom, _month, dow] = parts;

  const minuteValue = min.startsWith("*/") ? 1 : parseInt(min) || 0;
  const hourValue = hour.startsWith("*/") ? 1 : parseInt(hour) || 9;
  const dayOfMonth = parseInt(dom) || 1;
  const dayOfWeek = dow || "0";
  const frequencyValue = min.startsWith("*/")
    ? parseInt(min.slice(2)) || 1
    : hour.startsWith("*/")
      ? parseInt(hour.slice(2)) || 1
      : 1;

  return { minuteValue, hourValue, dayOfMonth, dayOfWeek, frequencyValue };
}

function generateCronFromBuilder(
  frequency: Frequency,
  minuteValue: number,
  hourValue: number,
  dayOfMonth: number,
  dayOfWeek: string,
  frequencyValue: number
): string {
  switch (frequency) {
    case "minutely":
      return `*/${frequencyValue} * * * *`;
    case "hourly":
      return `${minuteValue} */${frequencyValue} * * *`;
    case "daily":
      return `${minuteValue} ${hourValue} * * *`;
    case "weekly":
      return `${minuteValue} ${hourValue} * * ${dayOfWeek}`;
    case "monthly":
      return `${minuteValue} ${hourValue} ${dayOfMonth} * *`;
    default:
      return "0 9 * * *";
  }
}

function CronConfig({
  trigger,
  onConfigChange,
}: {
  trigger?: Record<string, any> | null;
  onConfigChange: (config: Record<string, any>) => void;
}) {
  const initialCron = trigger?.cronExpression ?? "0 9 * * *";
  const frequency = detectFrequencyFromCron(initialCron);
  const values = extractValuesFromCron(initialCron);

  const [selectedFrequency, setSelectedFrequency] = useState<Frequency>(frequency);
  const [minuteValue, setMinuteValue] = useState(values.minuteValue);
  const [hourValue, setHourValue] = useState(values.hourValue);
  const [dayOfMonth, setDayOfMonth] = useState(values.dayOfMonth);
  const [dayOfWeek, setDayOfWeek] = useState(values.dayOfWeek);
  const [frequencyValue, setFrequencyValue] = useState(values.frequencyValue);

  const generatedCron = generateCronFromBuilder(
    selectedFrequency,
    minuteValue,
    hourValue,
    dayOfMonth,
    dayOfWeek,
    frequencyValue
  );

  const handleFrequencyChange = (newFrequency: Frequency) => {
    setSelectedFrequency(newFrequency);
    // Reset frequency-specific values to defaults
    if (newFrequency === "minutely") {
      setFrequencyValue(1);
    } else if (newFrequency === "hourly") {
      setFrequencyValue(1);
      setMinuteValue(0);
    } else if (newFrequency === "daily") {
      setMinuteValue(0);
      setHourValue(9);
    } else if (newFrequency === "weekly") {
      setMinuteValue(0);
      setHourValue(9);
      setDayOfWeek("0");
    } else if (newFrequency === "monthly") {
      setMinuteValue(0);
      setHourValue(9);
      setDayOfMonth(1);
    }
  };

  const updateAndNotify = (updates: Record<string, any>) => {
    const newCron = generateCronFromBuilder(
      updates.frequency ?? selectedFrequency,
      updates.minuteValue ?? minuteValue,
      updates.hourValue ?? hourValue,
      updates.dayOfMonth ?? dayOfMonth,
      updates.dayOfWeek ?? dayOfWeek,
      updates.frequencyValue ?? frequencyValue
    );
    onConfigChange({ cronExpression: newCron });
  };

  const handleMinuteChange = (val: number) => {
    setMinuteValue(val);
    updateAndNotify({ minuteValue: val });
  };

  const handleHourChange = (val: number) => {
    setHourValue(val);
    updateAndNotify({ hourValue: val });
  };

  const handleDayOfWeekChange = (val: string) => {
    setDayOfWeek(val);
    updateAndNotify({ dayOfWeek: val });
  };

  const handleDayOfMonthChange = (val: number) => {
    setDayOfMonth(val);
    updateAndNotify({ dayOfMonth: val });
  };

  const handleFrequencyValueChange = (val: number) => {
    setFrequencyValue(val);
    updateAndNotify({ frequencyValue: val });
  };

  const handleFrequencyChangeAndNotify = (newFreq: Frequency) => {
    handleFrequencyChange(newFreq);
    const newCron = generateCronFromBuilder(newFreq, minuteValue, hourValue, dayOfMonth, dayOfWeek, frequencyValue);
    onConfigChange({ cronExpression: newCron });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold block text-foreground-400 mb-2">Frequency</label>
        <Select
          selectedKey={selectedFrequency}
          valueLabel={selectedFrequency}
          onSelectionChange={(key) => handleFrequencyChangeAndNotify(key as Frequency)}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select frequency" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="minutely">Every X minutes</Select.Item>
            <Select.Item value="hourly">Every X hours</Select.Item>
            <Select.Item value="daily">Daily</Select.Item>
            <Select.Item value="weekly">Weekly</Select.Item>
            <Select.Item value="monthly">Monthly</Select.Item>
          </Select.Content>
        </Select>
      </div>

      {selectedFrequency === "minutely" && (
        <div>
          <label className="text-xs font-semibold block text-foreground-400 mb-2">Every N minutes</label>
          <Input
            type="number"
            min="1"
            max="59"
            value={frequencyValue}
            onChange={(e) => handleFrequencyValueChange(parseInt(e.target.value) || 1)}
          />
        </div>
      )}

      {selectedFrequency === "hourly" && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold block text-foreground-400 mb-2">Every N hours</label>
            <Input
              type="number"
              min="1"
              max="23"
              value={frequencyValue}
              onChange={(e) => handleFrequencyValueChange(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold block text-foreground-400 mb-2">At minute</label>
            <Select
              selectedKey={minuteValue.toString()}
              valueLabel={minuteValue.toString().padStart(2, "0")}
              onSelectionChange={(key) => handleMinuteChange(parseInt(key as string))}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select minute" className="rounded-xl!" />
              </Select.Trigger>
              <Select.Content>
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <Select.Item key={m} value={m.toString()}>{m.toString().padStart(2, "0")}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>
      )}

      {selectedFrequency === "daily" && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold block text-foreground-400 mb-2">Hour</label>
            <Select
              selectedKey={hourValue.toString()}
              valueLabel={hourValue.toString().padStart(2, "0")}
              onSelectionChange={(key) => handleHourChange(parseInt(key as string))}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select hour" className="rounded-xl!" />
              </Select.Trigger>
              <Select.Content>
                {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                  <Select.Item key={h} value={h.toString()}>{h.toString().padStart(2, "0")}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold block text-foreground-400 mb-2">Minute</label>
            <Select
              selectedKey={minuteValue.toString()}
              valueLabel={minuteValue.toString().padStart(2, "0")}
              onSelectionChange={(key) => handleMinuteChange(parseInt(key as string))}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select minute" className="rounded-xl!" />
              </Select.Trigger>
              <Select.Content>
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <Select.Item key={m} value={m.toString()}>{m.toString().padStart(2, "0")}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>
      )}

      {selectedFrequency === "weekly" && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold block text-foreground-400 mb-2">Day of week</label>
            <Select
              selectedKey={dayOfWeek}
              valueLabel={DAY_NAMES[parseInt(dayOfWeek)] || dayOfWeek}
              onSelectionChange={(key) => handleDayOfWeekChange(key as string)}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select day" className="rounded-xl!" />
              </Select.Trigger>
              <Select.Content>
                {DAY_NAMES.map((day, idx) => (
                  <Select.Item key={idx} value={idx.toString()}>{day}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold block text-foreground-400 mb-2">Hour</label>
              <Select
                selectedKey={hourValue.toString()}
                valueLabel={hourValue.toString().padStart(2, "0")}
                onSelectionChange={(key) => handleHourChange(parseInt(key as string))}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select hour" className="rounded-xl!" />
                </Select.Trigger>
                <Select.Content>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <Select.Item key={h} value={h.toString()}>{h.toString().padStart(2, "0")}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold block text-foreground-400 mb-2">Minute</label>
              <Select
                selectedKey={minuteValue.toString()}
                valueLabel={minuteValue.toString().padStart(2, "0")}
                onSelectionChange={(key) => handleMinuteChange(parseInt(key as string))}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select minute" className="rounded-xl!" />
                </Select.Trigger>
                <Select.Content>
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <Select.Item key={m} value={m.toString()}>{m.toString().padStart(2, "0")}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>
      )}

      {selectedFrequency === "monthly" && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold block text-foreground-400 mb-2">Day of month</label>
            <Input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => handleDayOfMonthChange(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold block text-foreground-400 mb-2">Hour</label>
              <Select
                selectedKey={hourValue.toString()}
                valueLabel={hourValue.toString().padStart(2, "0")}
                onSelectionChange={(key) => handleHourChange(parseInt(key as string))}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select hour" className="rounded-xl!" />
                </Select.Trigger>
                <Select.Content>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <Select.Item key={h} value={h.toString()}>{h.toString().padStart(2, "0")}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold block text-foreground-400 mb-2">Minute</label>
              <Select
                selectedKey={minuteValue.toString()}
                valueLabel={minuteValue.toString().padStart(2, "0")}
                onSelectionChange={(key) => handleMinuteChange(parseInt(key as string))}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select minute" className="rounded-xl!" />
                </Select.Trigger>
                <Select.Content>
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <Select.Item key={m} value={m.toString()}>{m.toString().padStart(2, "0")}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold block text-foreground-400 mb-2">Cron Expression</label>
        <input
          readOnly
          value={generatedCron}
          className="w-full px-2 py-1 text-sm bg-background-700 border border-background-600 rounded text-foreground-300 font-mono"
        />
        <p className="text-xs text-foreground-400 mt-1 italic">{describeCron(generatedCron)}</p>
      </div>

      <div>
        <label className="text-xs font-semibold block text-foreground-400 mb-2">Timezone</label>
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
          selectedKey={trigger?.changeType ?? "all"}
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
          selectedKey={method}
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
    <div className="p-2 flex flex-col gap-3">
      <div>
        <label className="text-xs font-semibold block mb-1">Trigger Type</label>
        <Select
          selectedKey={triggerType}
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
