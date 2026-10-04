import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export interface NetworkAnalysis {
  detected: boolean;
  issues: {
    type: string;
    evidence: string;
    explanation: string;
  }[];
  explanation: string;
}

export function analyzeNetwork(
  input: string
): NetworkAnalysis {
  const issues: NetworkAnalysis["issues"] = [];

  // Packet loss
  const packetLossMatch = input.match(
    /(\d+(?:\.\d+)?)%\s*(?:packet\s*)?(?:loss|lost)/i
  );

  if (packetLossMatch) {
    const loss = packetLossMatch[1];

    if (parseFloat(loss) > 0) {
      issues.push({
        type: "Packet Loss",
        evidence: `${loss}% packet loss`,
        explanation:
          `The trace reports ${loss}% packet loss. ` +
          `Packets are not successfully reaching the destination or their responses are not returning.`,
      });
    }
  }

  // Destination unreachable
  if (
    /destination\s+(?:host\s+)?unreachable/i.test(input) ||
    /host\s+unreachable/i.test(input)
  ) {
    issues.push({
      type: "Destination Unreachable",
      evidence: "Destination/host unreachable message detected",
      explanation:
        "The network path cannot currently reach the destination. " +
        "Possible causes include routing problems, an unavailable host, or a connectivity failure.",
    });
  }

  // Request timeout
  if (
    /request\s+timed\s+out/i.test(input) ||
    /request\s+timeout/i.test(input) ||
    /timed\s+out/i.test(input)
  ) {
    issues.push({
      type: "Request Timeout",
      evidence: "Timeout message detected",
      explanation:
        "A response was not received within the expected time. " +
        "This can indicate packet loss, high latency, filtering, congestion, or an unavailable destination.",
    });
  }

  // Connection refused
  if (
    /connection\s+refused/i.test(input) ||
    /connection\s+reset/i.test(input)
  ) {
    issues.push({
      type: "Connection Failure",
      evidence: "Connection refused/reset message detected",
      explanation:
        "The connection could not be established or was terminated by the remote endpoint. " +
        "This can occur when a service is not listening, a connection is actively rejected, or an intermediate device terminates it.",
    });
  }

  // High latency
  const latencyMatches = [
    ...input.matchAll(
      /(?:time|latency)[=<]?\s*(\d+(?:\.\d+)?)\s*ms/gi
    ),
  ];

  const highLatencyValues = latencyMatches
    .map((match) => parseFloat(match[1]))
    .filter((value) => value > 200);

  if (highLatencyValues.length > 0) {
    const maxLatency = Math.max(...highLatencyValues);

    issues.push({
      type: "High Latency",
      evidence: `Latency of ${maxLatency} ms detected`,
      explanation:
        `The trace contains a response time of ${maxLatency} ms, ` +
        "which may indicate network congestion, a long routing path, or a slow destination.",
    });
  }

  // Routing failure
  if (
    /no\s+route\s+to\s+host/i.test(input) ||
    /network\s+is\s+unreachable/i.test(input)
  ) {
    issues.push({
      type: "Routing Failure",
      evidence:
        "No route to host/network unreachable message detected",
      explanation:
        "The system does not have a usable route toward the destination network or host.",
    });
  }

  const detected = issues.length > 0;

  const explanation = detected
    ? issues.map((issue) => issue.explanation).join(" ")
    : "No obvious network connectivity problems were detected.";

  return {
    detected,
    issues,
    explanation,
  };
}

export const networkAnalyzer = createTool({
  id: "network-analyzer",

  description:
    "Analyzes network logs, ping output, traceroute output, and connectivity errors for common network problems.",

  inputSchema: z.object({
    input: z.string().describe("Network logs, ping, traceroute, or error output"),
  }),

  outputSchema: z.object({
    detected: z.boolean(),
    issues: z.array(
      z.object({
        type: z.string(),
        evidence: z.string(),
        explanation: z.string(),
      })
    ),
    explanation: z.string(),
  }),

  execute: async ({ input }) => {
    return analyzeNetwork(input);
  },
});