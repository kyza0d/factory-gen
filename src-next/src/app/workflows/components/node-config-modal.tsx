"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Modal, ModalFooter, Button, Input, Label, Select, Badge, Switch, Divider, Tabs, TabsList, TabsTrigger, TabsContent, Card } from "ui-lab-components";
import { UINode, IOParam, NodeModule } from "@registry/types";
import { FaRegUser, FaAtom, FaRegEye, FaFileLines, FaRegTrashCan, FaRegImage, FaQuestion, FaBolt, FaPlus, FaClock } from "react-icons/fa6";
import { TriggerNodeConfig } from "./trigger-node-config";

const nodeTypeIcons: Record<string, React.ElementType> = {
  Input: FaRegUser,
  AI: FaAtom,
  Output: FaRegEye,
  TextSummarizer: FaFileLines,
  ImageGenerator: FaRegImage,
  InvalidNode: FaRegTrashCan,
  Trigger: FaBolt,
  default: FaQuestion,
};

interface NodeConfigModalProps {
  node: UINode | null;
  onSave?: (values: Record<string, unknown>) => void;
  onClose: () => void;
  trigger?: Record<string, any> | null;
  onTriggerUpdate?: (triggerId: string, config: Record<string, any>) => void;
}

export function NodeConfigModal({ node, onSave, onClose, trigger, onTriggerUpdate }: NodeConfigModalProps) {
  const [values, setValues] = useState<Record<string, unknown>>(
    Object.fromEntries(
      (node?.parameters ?? []).map((p: IOParam) => [p.id, p.defaultValue ?? ""])
    )
  );
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("parameters");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleValue, setEditingModuleValue] = useState("");
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);

  // Convex mutations
  const updateParameter = useMutation(api.node_configuration.updateNodeParameterPublic);
  const updateParameterDefinition = useMutation(api.node_configuration.updateNodeParameterDefinitionPublic);
  const updateModule = useMutation(api.node_configuration.updateNodeModulePublic);

  React.useEffect(() => {
    setValues(
      Object.fromEntries(
        (node?.parameters ?? []).map((p: IOParam) => [p.id, p.defaultValue ?? ""])
      )
    );
    setAttemptedSave(false);
    setFieldErrors({});
    setEditingModuleId(null);
    setOperationError(null);
    setOperationSuccess(null);
  }, [node?.id]);

  const handleChange = async (paramId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [paramId]: value }));
    if (fieldErrors[paramId]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[paramId]; return next; });
    }

    // Persist parameter change to backend
    if (node?.id) {
      try {
        setOperationError(null);
        await updateParameter({
          nodeId: node.id,
          paramId,
          value,
        });
        setOperationSuccess("Configuration saved");
        setTimeout(() => setOperationSuccess(null), 2000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save configuration";
        setOperationError(message);
      }
    }
  };

  const handleToggleParameter = async (paramId: string, enabled: boolean) => {
    if (!node?.id) return;
    try {
      setOperationError(null);
      await updateParameterDefinition({
        nodeId: node.id,
        paramId,
        enabled,
      });
      setOperationSuccess(enabled ? "Parameter enabled" : "Parameter disabled");
      setTimeout(() => setOperationSuccess(null), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update parameter";
      setOperationError(message);
    }
  };

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    if (!node?.id) return;
    try {
      setOperationError(null);
      await updateModule({
        nodeId: node.id,
        moduleId,
        enabled,
      });
      setOperationSuccess(enabled ? "Module enabled" : "Module disabled");
      setTimeout(() => setOperationSuccess(null), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update module";
      setOperationError(message);
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    if (!node?.id) return;

    try {
      setOperationError(null);
      await updateModule({
        nodeId: node.id,
        moduleId,
        value: editingModuleValue || null,
      });
      setEditingModuleId(null);
      setOperationSuccess("Module updated");
      setTimeout(() => setOperationSuccess(null), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update module";
      setOperationError(message);
    }
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    (node?.parameters ?? []).filter(p => p.enabled !== false).forEach((p: IOParam) => {
      const isRequired = (p as IOParam & { required?: boolean }).required;
      if (isRequired) {
        const val = values[p.id];
        if (val === undefined || val === null || val === "") {
          errors[p.id] = `${p.name} is required`;
        }
      }
    });
    return errors;
  };

  const hasErrors = (errors: Record<string, string>) => Object.keys(errors).length > 0;

  const handleSave = () => {
    setAttemptedSave(true);
    const errors = validate();
    setFieldErrors(errors);
    if (!hasErrors(errors)) {
      onSave?.(values);
    }
  };

  const saveIsDisabled = attemptedSave && hasErrors(fieldErrors);

  const modules = (node?.modules ?? []) as NodeModule[];
  const parameters = (node?.parameters ?? []) as IOParam[];

  return (
    <Modal
      isOpen={node !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={node?.label}
      closeButton
      className="h-120"
      footer={
        <ModalFooter className="flex items-center justify-between">
          <div>
            {operationError && (
              <p className="text-xs text-danger-500">{operationError}</p>
            )}
            {operationSuccess && (
              <p className="text-xs text-success-500">{operationSuccess}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button size="sm" variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button size="sm" variant="default" onPress={handleSave}>
              Save
            </Button>
          </div>
        </ModalFooter>
      }
    >
      {/* Node type identity badge */}
      {node?.type && (
        <div className="flex items-center gap-2 px-2 py-3">
          {(() => {
            const IconComponent = nodeTypeIcons[node.type] || nodeTypeIcons.default;
            return (
              <Badge icon={<IconComponent className="text-foreground-400" />} size="sm" className="bg-background-600">
                {node.label}
              </Badge>
            );
          })()}
        </div>
      )}

      {/* Tabs for Parameters and Modules */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList aria-label="Configuration sections" className="rounded-none border-b border-background-700">
          <TabsTrigger value="parameters">Parameters ({parameters.length})</TabsTrigger>
          <TabsTrigger value="modules">Modules ({modules.length})</TabsTrigger>
        </TabsList>

        {/* Parameters Tab Content */}
        <TabsContent value="parameters" className="flex flex-col gap-4 px-2 py-1">
          {node?.type === "Trigger" ? (
            <TriggerNodeConfig
              triggerType={(values["trigger-type-param"] as any) || (trigger?.type ?? "webhook")}
              trigger={trigger}
              workflowId={trigger?.workflowId ?? ""}
              nodeId={node.id}
              onTypeChange={(newType) => {
                handleChange("trigger-type-param", newType);
                if (trigger?._id && onTriggerUpdate) {
                  onTriggerUpdate(trigger._id, { type: newType });
                }
              }}
              onConfigChange={(config) => {
                if (trigger?._id && onTriggerUpdate) {
                  onTriggerUpdate(trigger._id, config);
                }
              }}
            />
          ) : parameters.length === 0 ? (
            <p className="text-sm text-foreground-500">No parameters to configure</p>
          ) : (
            parameters.map((param: IOParam) => {
              const isRequired = (param as IOParam & { required?: boolean }).required;
              const error = attemptedSave ? fieldErrors[param.id] : undefined;
              const isEnabled = param.enabled !== false;

              return (
                <div key={param.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`param-${param.id}`}
                        className="text-xs font-semibold flex items-center gap-2"
                        required={isRequired}
                        error={!!error}
                      >
                        {param.name}
                        {param.type && <Badge size="sm" variant="default">{param.type}</Badge>}
                      </Label>
                      {param.description && <p className="text-xs text-foreground-500 mt-0.5">{param.description}</p>}
                    </div>
                    <Switch
                      isSelected={isEnabled}
                      onChange={(selected) => handleToggleParameter(param.id, selected)}
                      aria-label={`Enable ${param.name}`}
                    />
                  </div>

                  {isEnabled && (
                    <div className="mt-2">
                      {param.options ? (
                        <Select
                          selectedKey={String(values[param.id] ?? param.defaultValue ?? "")}
                          valueLabel={String(values[param.id] ?? param.defaultValue ?? "")}
                          onSelectionChange={(key) => handleChange(param.id, key)}
                          className="w-full"
                        >
                          <Select.Trigger>
                            <Select.Value placeholder="Select an option" />
                          </Select.Trigger>
                          <Select.Content>
                            {param.options.map((opt: string) => (
                              <Select.Item key={opt} value={opt}>
                                {opt}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      ) : param.type === "boolean" ? (
                        <Switch
                          id={`param-${param.id}`}
                          isSelected={Boolean(values[param.id] ?? param.defaultValue ?? false)}
                          onChange={(isSelected) => handleChange(param.id, isSelected)}
                        />
                      ) : param.type === "number" ? (
                        <Input
                          id={`param-${param.id}`}
                          type="number"
                          value={String(values[param.id] ?? param.defaultValue ?? "")}
                          onChange={(e) => handleChange(param.id, e.target.valueAsNumber)}
                          className="w-full"
                          error={!!error}
                        />
                      ) : (
                        <Input
                          id={`param-${param.id}`}
                          type="text"
                          value={String(values[param.id] ?? param.defaultValue ?? "")}
                          onChange={(e) => handleChange(param.id, e.target.value)}
                          className="w-full"
                          error={!!error}
                        />
                      )}
                      {error && (
                        <p className="text-xs text-danger-400 mt-1">{error}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Modules Tab Content */}
        <TabsContent value="modules" className="flex flex-col gap-4 px-2 py-4">
          {modules.length === 0 ? (
            <p className="text-sm text-foreground-500">No modules for this node type</p>
          ) : (
            modules.map((module: NodeModule) => {
              const isEnabled = module.enabled ?? true;
              return (
                <div className="not-last:border-b p-2 border-background-700" key={module.id}>
                  {editingModuleId === module.id ? (
                    <div className="space-y-2">
                      <Label size="sm" htmlFor={`module-value-${module.id}`}>
                        Value
                      </Label>
                      <Input
                        id={`module-value-${module.id}`}
                        type="text"
                        value={editingModuleValue}
                        onChange={(e) => setEditingModuleValue(e.target.value)}
                        placeholder="Module value"
                        className="w-full"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => {
                            setEditingModuleId(null);
                            setEditingModuleValue("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onPress={() => handleUpdateModule(module.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground-900">{module.label}</p>
                            <Badge size="sm" variant="default">{module.type}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isEnabled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onPress={() => {
                                setEditingModuleId(module.id);
                                setEditingModuleValue(module.value || "");
                              }}
                            >
                              Edit
                            </Button>
                          )}
                          <Switch
                            isSelected={isEnabled}
                            onChange={(selected) => handleToggleModule(module.id, selected)}
                            aria-label={`Enable ${module.label}`}
                          />
                        </div>
                      </div>
                      {isEnabled && module.value && (
                        <p className="text-sm text-foreground-700 bg-background-100 p-2 rounded truncate mt-2">
                          {module.value}
                        </p>
                      )}
                      {isEnabled && !module.value && (
                        <p className="text-xs italic text-foreground-400 mt-2">No value set</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </Modal>
  );
}
