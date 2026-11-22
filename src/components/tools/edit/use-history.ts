"use client";

import { useReducer } from "react";
import type { EditObject } from "@/lib/pdf/edit";

type State = { past: EditObject[][]; present: EditObject[]; future: EditObject[][] };

type Action =
  | { type: "checkpoint" }
  | { type: "add"; object: EditObject }
  | { type: "update"; id: string; patch: Partial<EditObject> }
  | { type: "replace"; id: string; object: EditObject }
  | { type: "remove"; id: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" };

const LIMIT = 100;

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "checkpoint":
      return { past: [...s.past, s.present].slice(-LIMIT), present: s.present, future: [] };
    case "add":
      return { ...s, present: [...s.present, a.object] };
    case "update":
      return { ...s, present: s.present.map((o) => (o.id === a.id ? ({ ...o, ...a.patch } as EditObject) : o)) };
    case "replace":
      return { ...s, present: s.present.map((o) => (o.id === a.id ? a.object : o)) };
    case "remove":
      return { ...s, present: s.present.filter((o) => o.id !== a.id) };
    case "undo":
      if (!s.past.length) return s;
      return { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] };
    case "redo":
      if (!s.future.length) return s;
      return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) };
    case "reset":
      return { past: [], present: [], future: [] };
  }
}

/**
 * Object list with undo/redo. Call `checkpoint()` once BEFORE a change (or a series of changes,
 * like a drag) — everything after it until the next checkpoint is undone in one step.
 */
export function useHistory() {
  const [state, dispatch] = useReducer(reducer, { past: [], present: [], future: [] });
  return {
    objects: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    checkpoint: () => dispatch({ type: "checkpoint" }),
    add: (object: EditObject) => dispatch({ type: "add", object }),
    update: (id: string, patch: Partial<EditObject>) => dispatch({ type: "update", id, patch }),
    replace: (id: string, object: EditObject) => dispatch({ type: "replace", id, object }),
    remove: (id: string) => dispatch({ type: "remove", id }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    reset: () => dispatch({ type: "reset" }),
  };
}

export type History = ReturnType<typeof useHistory>;
