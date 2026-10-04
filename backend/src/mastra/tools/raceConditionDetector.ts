import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export interface RaceConditionAnalysis {
  detected: boolean;
  sharedVariables: string[];
  accesses: {
    thread: string;
    variable: string;
    type: "read" | "write";
  }[];
  explanation: string;
}

export function detectRaceCondition(
  code: string
): RaceConditionAnalysis {
  const sharedVariables = new Set<string>();

  // Detect global variables that are not obviously synchronized.
  const globalRegex =
    /^(?:int|float|double|long|short|char|bool)\s+(\w+)\s*(?:=|;)/gm;

  let match: RegExpExecArray | null;

  while ((match = globalRegex.exec(code)) !== null) {
    sharedVariables.add(match[1]);
  }

  const accesses: RaceConditionAnalysis["accesses"] = [];

  // Find functions that look like thread functions.
  const functionRegex =
    /(?:void|int|unsigned\s+\w+|\w+)\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\}/g;

  while ((match = functionRegex.exec(code)) !== null) {
    const functionName = match[1];
    const body = match[2];

    for (const variable of sharedVariables) {
      const variableRegex = new RegExp(
        `\\b${variable}\\b`,
        "g"
      );

      const occurrences = body.match(variableRegex);

      if (!occurrences) {
        continue;
      }

      // Simple assignment detection.
      const writeRegex = new RegExp(
        `\\b${variable}\\b\\s*(?:\\+\\+|--|[+\\-*/]?=)`,
        "g"
      );

      const writes = body.match(writeRegex);

      if (writes) {
        accesses.push({
          thread: functionName,
          variable,
          type: "write",
        });
      } else {
        accesses.push({
          thread: functionName,
          variable,
          type: "read",
        });
      }
    }
  }

  const detectedVariables = new Set<string>();

  for (let i = 0; i < accesses.length; i++) {
    for (let j = i + 1; j < accesses.length; j++) {
      const first = accesses[i];
      const second = accesses[j];

      if (
        first.variable === second.variable &&
        first.thread !== second.thread &&
        (first.type === "write" || second.type === "write")
      ) {
        detectedVariables.add(first.variable);
      }
    }
  }

  const detected = detectedVariables.size > 0;

  let explanation =
    "No obvious race condition was detected.";

  if (detected) {
    const variables = [...detectedVariables].join(", ");

    explanation =
      `Potential race condition detected on shared variable(s): ${variables}. ` +
      `Multiple thread functions access the same shared variable and at least ` +
      `one access is a write. No obvious synchronization protecting the access ` +
      `was detected by this analyzer.`;
  }

  return {
    detected,
    sharedVariables: [...sharedVariables],
    accesses,
    explanation,
  };
}

export const raceConditionDetector = createTool({
  id: "race-condition-detector",

  description:
    "Detects potential race conditions by analyzing shared variable accesses across thread functions.",

  inputSchema: z.object({
    code: z.string().describe("C or C++ source code"),
  }),

  outputSchema: z.object({
    detected: z.boolean(),
    sharedVariables: z.array(z.string()),
    accesses: z.array(
      z.object({
        thread: z.string(),
        variable: z.string(),
        type: z.enum(["read", "write"]),
      })
    ),
    explanation: z.string(),
  }),

  execute: async ({ code }) => {
    return detectRaceCondition(code);
  },
});