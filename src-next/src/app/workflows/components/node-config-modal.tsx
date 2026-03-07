"use client";

import React, { useState } from "react";
import { Modal, ModalFooter, Button, Input, Label, Select, Badge, Switch, Divider } from "ui-lab-components";
import { UINode, IOParam } from "@registry/types";
import { FaRegUser, FaAtom, FaRegEye, FaFileLines, FaRegTrashCan, FaRegImage, FaQuestion, FaBolt } from "react-icons/fa6";

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
  onSave: (values: Record<string, unknown>) => void;
  onClose: () => void;
}

export function NodeConfigModal({ node, onSave, onClose }: NodeConfigModalProps) {
  const [values, setValues] = useState<Record<string, unknown>>(
    Object.fromEntries(
      (node?.parameters ?? []).map((p: IOParam) => [p.id, p.defaultValue ?? ""])
    )
  );
  // GAP 1: track whether a save has been attempted so errors only show after first attempt
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    setValues(
      Object.fromEntries(
        (node?.parameters ?? []).map((p: IOParam) => [p.id, p.defaultValue ?? ""])
      )
    );
    // Reset validation state when node changes
    setAttemptedSave(false);
    setFieldErrors({});
  }, [node?.id]);

  const handleChange = (paramId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [paramId]: value }));
    // Clear error for this field as user edits it
    if (fieldErrors[paramId]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[paramId]; return next; });
    }
  };

  // GAP 1: validate required fields and collect errors
  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    (node?.parameters ?? []).forEach((p: IOParam) => {
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
      onSave(values);
    }
  };

  const saveIsDisabled = attemptedSave && hasErrors(fieldErrors);

  return (
    <Modal
      isOpen={node !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={node?.label}
      closeButton
      footer={
        <ModalFooter className="flex items-center justify-end gap-4">
          {/* GAP 5: Divider for visual separation, primary variant for Save */}
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Divider orientation="vertical" spacing="none" />
          <Button variant="primary" onPress={handleSave} isDisabled={saveIsDisabled}>
            Save
          </Button>
        </ModalFooter>
      }
    >
      {/* GAP 4: Header node-type identity badge */}
      {node?.type && (
        <div className="flex items-center gap-2 pb-3">
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
      <div className="flex flex-col gap-3 py-1">
        {node?.parameters?.map((param: IOParam) => {
          const isRequired = (param as IOParam & { required?: boolean }).required;
          const error = attemptedSave ? fieldErrors[param.id] : undefined;

          return (
            <div key={param.id}>
              {/* GAP 1 & 3: required marker + description as helperText on Label */}
              <Label
                htmlFor={`param-${param.id}`}
                size="sm"
                className="mb-1 capitalize"
                required={isRequired}
                helperText={param.description || undefined}
                error={!!error}
              >
                {param.name}
              </Label>
              {/* GAP 2: Input type routing */}
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
              {/* GAP 1: per-field error message */}
              {error && (
                <p className="text-xs text-danger-400 mt-1">{error}</p>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
