import { NodeMetadata } from "../types";

export const TriggerMetadata: NodeMetadata = {
  type: "Trigger",
  label: "Trigger",
  description: "Automation entry point. Listens for webhooks, scheduled events, file changes, or HTTP requests.",
  icon: "FaBolt",
  uiComponent: "Trigger",
  inputs: [],
  outputs: [
    {
      id: "trigger-payload",
      name: "payload",
      type: "json",
      description: "Event payload from the trigger source",
      defaultValue: null,
      options: null,
    },
    {
      id: "trigger-timestamp",
      name: "timestamp",
      type: "string",
      description: "ISO 8601 timestamp when trigger fired",
      defaultValue: null,
      options: null,
    },
  ],
  parameters: [
    {
      id: "trigger-type-param",
      name: "type",
      type: "string",
      description: "Type of automation trigger",
      defaultValue: "webhook",
      options: ["webhook", "cron", "fileChange", "httpRequest"],
      enabled: true,
    },
    {
      id: "trigger-config-param",
      name: "configuration",
      type: "string",
      description: "JSON configuration specific to trigger type",
      defaultValue: "{}",
      options: null,
      enabled: true,
    },
  ],
  modules: [
    {
      type: "badge",
      label: "Status",
      value: "listening",
      enabled: true,
    },
    {
      type: "text",
      label: "Last Event",
      value: null,
      enabled: true,
    },
  ],
};
