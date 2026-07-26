import type { FigureSpec } from "../types";
import { ExprLine } from "./ExprLine";
import { Bags } from "./Bags";

export function Figure({ spec }: { spec?: FigureSpec }) {
  if (!spec) return null;
  switch (spec.kind) {
    case "expr":
      return <ExprLine spec={spec} />;
    case "bags":
      return <Bags spec={spec} />;
    default:
      return null;
  }
}
