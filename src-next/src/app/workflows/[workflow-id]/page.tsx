import { WorkflowView } from "./workflow-view";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <WorkflowView />;
}
