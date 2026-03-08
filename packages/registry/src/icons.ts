import type { IconType } from "react-icons";
import {
  FaBolt,
  FaAtom,
  FaRegEye,
  FaRegUser,
  FaFileLines,
  FaRegImage,
  FaTrashCan,
  FaQuestion,
} from "react-icons/fa6";

/**
 * Centralized icon registry for all node types.
 * Each key matches the `icon` field on NodeMetadata.
 * Add a new entry here whenever a new node type is introduced.
 */
export const NODE_TYPE_ICONS: Record<string, IconType> = {
  // Core node types
  FaBolt,       // Trigger
  FaRegUser,    // Input (User Input)
  FaAtom,       // AI Processing
  FaRegEye,     // Output (Preview)

  // Extended node types
  FaFileLines,  // TextSummarizer
  FaRegImage,   // ImageGenerator
  FaTrashCan,   // InvalidNode

  // Fallback
  FaQuestion,
};

/** The icon used when a node type has no registered icon. */
export const DEFAULT_NODE_ICON: IconType = FaQuestion;

/**
 * Resolves the icon component for a given icon key.
 * Falls back to DEFAULT_NODE_ICON if the key is missing or unregistered.
 */
export function resolveNodeIcon(iconKey: string | undefined): IconType {
  if (iconKey && iconKey in NODE_TYPE_ICONS) {
    return NODE_TYPE_ICONS[iconKey];
  }
  return DEFAULT_NODE_ICON;
}
