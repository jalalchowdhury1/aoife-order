import type { ReactNode } from "react";

// The sibling app (aoife-frameworks) renders time chips here. This app has no
// rich tokens — kept as a seam so engine call sites stay identical.
export function renderRich(text: string): ReactNode {
  return text;
}
