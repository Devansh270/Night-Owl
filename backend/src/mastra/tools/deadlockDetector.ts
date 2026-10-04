import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export interface DeadlockAnalysis {
  detected: boolean;
  locks: string[];
  lockOrders: {
    thread: string;
    order: string[];
  }[];
  explanation: string;
}

export function detectDeadlock(code: string): DeadlockAnalysis {
  const lockOrders: {
    thread: string;
    order: string[];
  }[] = [];

  const functionRegex =
    /(?:void|int|unsigned\s+\w+|\w+)\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\}/g;

  let match: RegExpExecArray | null;

  while ((match = functionRegex.exec(code)) !== null) {
    const functionName = match[1];
    const body = match[2];

    const locks: string[] = [];

    const lockRegex = /(\w+)\.lock\s*\(\s*\)/g;

    let lockMatch: RegExpExecArray | null;

    while ((lockMatch = lockRegex.exec(body)) !== null) {
      locks.push(lockMatch[1]);
    }

    if (locks.length > 0) {
      lockOrders.push({
        thread: functionName,
        order: locks,
      });
    }
  }

  const locks = [
    ...new Set(lockOrders.flatMap((item) => item.order)),
  ];

  let detected = false;

  let explanation =
    "No obvious lock-order deadlock was detected.";

  for (let i = 0; i < lockOrders.length; i++) {
    for (let j = i + 1; j < lockOrders.length; j++) {
      const first = lockOrders[i].order;
      const second = lockOrders[j].order;

      if (first.length < 2 || second.length < 2) {
        continue;
      }

      const firstPair = `${first[0]} -> ${first[1]}`;
      const reversePair = `${second[0]} -> ${second[1]}`;

      if (
        first[0] === second[1] &&
        first[1] === second[0]
      ) {
        detected = true;

        explanation =
          `Lock-order inversion detected. ` +
          `${lockOrders[i].thread} acquires ${firstPair}, ` +
          `while ${lockOrders[j].thread} acquires ${reversePair}. ` +
          `This creates a potential circular wait and therefore a potential deadlock.`;

        break;
      }
    }

    if (detected) {
      break;
    }
  }

  return {
    detected,
    locks,
    lockOrders,
    explanation,
  };
}

export const deadlockDetector = createTool({
  id: "deadlock-detector",

  description:
    "Detects potential deadlocks by analyzing mutex lock acquisition order in C/C++ code.",

  inputSchema: z.object({
    code: z.string().describe("C or C++ source code to analyze"),
  }),

  outputSchema: z.object({
    detected: z.boolean(),
    locks: z.array(z.string()),
    lockOrders: z.array(
      z.object({
        thread: z.string(),
        order: z.array(z.string()),
      })
    ),
    explanation: z.string(),
  }),

  execute: async ({ code }) => {
    return detectDeadlock(code);
  },
});