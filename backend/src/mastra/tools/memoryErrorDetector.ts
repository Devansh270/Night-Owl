import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export interface MemoryErrorAnalysis {
  detected: boolean;
  errors: {
    type: string;
    line?: string;
    explanation: string;
  }[];
  explanation: string;
}

export function detectMemoryErrors(
  code: string
): MemoryErrorAnalysis {
  const errors: MemoryErrorAnalysis["errors"] = [];

  // Null pointer dereference
  if (
    /(?:int|float|double|char|void)\s*\*\s*(\w+)\s*=\s*(?:nullptr|NULL|0)\s*;/.test(
      code
    )
  ) {
    const match = code.match(
      /(?:int|float|double|char|void)\s*\*\s*(\w+)\s*=\s*(?:nullptr|NULL|0)\s*;/
    );

    const pointer = match?.[1] ?? "pointer";

    const usageRegex = new RegExp(
      `\\*\\s*${pointer}\\s*=`
    );

    if (usageRegex.test(code)) {
      errors.push({
        type: "Null Pointer Dereference",
        line: `*${pointer}`,
        explanation:
          `Pointer '${pointer}' is initialized to null and is later dereferenced. ` +
          `Dereferencing a null pointer causes undefined behavior and may crash the program.`,
      });
    }
  }

  // Use-after-free
  const deleteMatches = [
    ...code.matchAll(
      /\bdelete\s+(\w+)\s*;/g
    ),
  ];

  for (const match of deleteMatches) {
    const pointer = match[1];

    const deleteIndex = match.index ?? -1;

    const remainingCode = code.slice(
      deleteIndex + match[0].length
    );

    const usageRegex = new RegExp(
      `\\*\\s*${pointer}\\b|\\b${pointer}\\s*\\[`
    );

    if (usageRegex.test(remainingCode)) {
      errors.push({
        type: "Use-After-Free",
        line: `delete ${pointer}`,
        explanation:
          `Pointer '${pointer}' is used after the memory it points to has been released. ` +
          `Accessing freed memory causes undefined behavior.`,
      });
    }
  }

  // Incorrect delete for array allocation
  const arrayAllocations = [
    ...code.matchAll(
      /\b(\w+)\s*=\s*new\s+[\w:<>]+\s*\[[^\]]*\]\s*;/g
    ),
  ];

  for (const match of arrayAllocations) {
    const pointer = match[1];

    const afterAllocation = code.slice(
      (match.index ?? 0) + match[0].length
    );

    const deleteRegex = new RegExp(
      `\\bdelete\\s+${pointer}\\s*;`
    );

    if (deleteRegex.test(afterAllocation)) {
      errors.push({
        type: "Incorrect Array Deallocation",
        line: `delete ${pointer}`,
        explanation:
          `Pointer '${pointer}' was allocated with 'new[]' but is released using 'delete'. ` +
          `Array allocations should be released using 'delete[]'.`,
      });
    }
  }

  const detected = errors.length > 0;

  const explanation = detected
    ? errors.map((error) => error.explanation).join(" ")
    : "No obvious memory errors were detected.";

  return {
    detected,
    errors,
    explanation,
  };
}

export const memoryErrorDetector = createTool({
  id: "memory-error-detector",

  description:
    "Detects common C/C++ memory errors such as null pointer dereferences, use-after-free, and incorrect array deallocation.",

  inputSchema: z.object({
    code: z.string().describe("C or C++ source code"),
  }),

  outputSchema: z.object({
    detected: z.boolean(),
    errors: z.array(
      z.object({
        type: z.string(),
        line: z.string().optional(),
        explanation: z.string(),
      })
    ),
    explanation: z.string(),
  }),

  execute: async ({ code }) => {
    return detectMemoryErrors(code);
  },
});