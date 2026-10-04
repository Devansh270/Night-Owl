import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { mastra } from "./mastra/index.js";
import { detectDeadlock } from "./mastra/tools/deadlockDetector.js";
import { detectRaceCondition } from "./mastra/tools/raceConditionDetector.js";
import { detectMemoryErrors } from "./mastra/tools/memoryErrorDetector.js";
import { analyzeNetwork } from "./mastra/tools/networkAnalyzer.js";
import { prisma } from "./db.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "2mb" }));

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "night-owl-backend",
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// HISTORY
// --------------------------------------------------

app.get("/api/history", async (_req, res) => {
  try {
    const sessions = await prisma.debugSession.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        analysis: true,
      },
    });

    return res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Failed to fetch history:", error);

    return res.status(500).json({
      error: "Failed to fetch analysis history.",
    });
  }
});

// --------------------------------------------------
// ANALYZE
// --------------------------------------------------

app.post("/api/analyze", async (req, res) => {
  const { domain, code } = req.body;

  if (!domain || !code) {
    return res.status(400).json({
      error: "domain and code are required",
    });
  }

  try {
    let evidence = "";

    const structuredEvidence = {
      analyzer: "Night-Owl Deterministic Analysis Engine",
      domain,
      checks: [] as {
        type: string;
        detected: boolean;
        details: string;
        explanation: string;
      }[],
    };

    // --------------------------------------------------
    // DEADLOCK GRAPH
    // --------------------------------------------------

    let deadlockGraph: {
      nodes: {
        id: string;
        type: "thread";
      }[];
      locks: {
        id: string;
        type: "lock";
      }[];
      edges: {
        from: string;
        to: string;
        type: "holds";
        order: number;
      }[];
      detected: boolean;
    } | null = null;

    // --------------------------------------------------
    // RACE GRAPH
    // --------------------------------------------------

    let raceGraph: {
      variables: {
        id: string;
      }[];
      accesses: {
        thread: string;
        variable: string;
        type: "read" | "write";
      }[];
      detected: boolean;
    } | null = null;

    // --------------------------------------------------
    // NETWORK GRAPH
    // --------------------------------------------------

    let networkGraph: {
      source: string;
      destination: string;
      packets: {
        id: number;
        status: "success" | "lost";
        latency?: number;
      }[];
      detected: boolean;
    } | null = null;

    // ==================================================
    // OS / CONCURRENCY
    // ==================================================

    if (domain === "os") {
      const deadlockAnalysis = detectDeadlock(code);

      deadlockGraph = {
        nodes: deadlockAnalysis.lockOrders.map((item) => ({
          id: item.thread,
          type: "thread" as const,
        })),

        locks: deadlockAnalysis.locks.map((lock) => ({
          id: lock,
          type: "lock" as const,
        })),

        edges: deadlockAnalysis.lockOrders.flatMap((item) =>
          item.order.map((lock, index) => ({
            from: item.thread,
            to: lock,
            type: "holds" as const,
            order: index + 1,
          }))
        ),

        detected: deadlockAnalysis.detected,
      };

      evidence = `
DETERMINISTIC DEADLOCK ANALYSIS

Deadlock detected: ${deadlockAnalysis.detected}

Locks:
${deadlockAnalysis.locks.join(", ") || "None detected"}

Lock acquisition order:
${
  deadlockAnalysis.lockOrders
    .map((item) => `${item.thread}: ${item.order.join(" -> ")}`)
    .join("\n") || "None detected"
}

Analyzer explanation:
${deadlockAnalysis.explanation}
`;

      structuredEvidence.checks.push({
        type: "Deadlock Detection",
        detected: deadlockAnalysis.detected,
        details:
          deadlockAnalysis.lockOrders
            .map(
              (item) =>
                `${item.thread}: ${item.order.join(" → ")}`
            )
            .join("\n") || "No lock acquisition order detected",
        explanation: deadlockAnalysis.explanation,
      });

      // --------------------------------------------------
      // RACE CONDITION
      // --------------------------------------------------

      const raceAnalysis = detectRaceCondition(code);

      raceGraph = {
        variables: raceAnalysis.sharedVariables.map((variable) => ({
          id: variable,
        })),

        accesses: raceAnalysis.accesses.map((access) => ({
          thread: access.thread,
          variable: access.variable,
          type: access.type,
        })),

        detected: raceAnalysis.detected,
      };

      evidence += `
DETERMINISTIC RACE CONDITION ANALYSIS

Race condition detected: ${raceAnalysis.detected}

Shared variables:
${raceAnalysis.sharedVariables.join(", ") || "None detected"}

Variable accesses:
${
  raceAnalysis.accesses
    .map(
      (item) =>
        `${item.thread}: ${item.variable} (${item.type})`
    )
    .join("\n") || "None detected"
}

Analyzer explanation:
${raceAnalysis.explanation}
`;

      structuredEvidence.checks.push({
        type: "Race Condition Detection",
        detected: raceAnalysis.detected,
        details:
          raceAnalysis.accesses
            .map(
              (item) =>
                `${item.thread}: ${item.variable} (${item.type})`
            )
            .join("\n") || "No shared variable accesses detected",
        explanation: raceAnalysis.explanation,
      });
    }

    // ==================================================
    // C / C++ MEMORY
    // ==================================================

    if (domain === "c_cpp") {
      const memoryAnalysis = detectMemoryErrors(code);

      evidence += `
DETERMINISTIC MEMORY ERROR ANALYSIS

Memory error detected: ${memoryAnalysis.detected}

Detected errors:
${
  memoryAnalysis.errors
    .map(
      (error) =>
        `${error.type}${
          error.line ? ` (${error.line})` : ""
        }: ${error.explanation}`
    )
    .join("\n") || "None detected"
}

Analyzer explanation:
${memoryAnalysis.explanation}
`;

      structuredEvidence.checks.push({
        type: "Memory Error Detection",
        detected: memoryAnalysis.detected,
        details:
          memoryAnalysis.errors
            .map(
              (error) =>
                `${error.type}${
                  error.line ? ` (${error.line})` : ""
                }`
            )
            .join("\n") || "No memory errors detected",
        explanation: memoryAnalysis.explanation,
      });
    }

    // ==================================================
    // NETWORK
    // ==================================================

    if (domain === "network") {
      const networkAnalysis = analyzeNetwork(code);

      const packetLossMatch = code.match(
        /(\d+(?:\.\d+)?)%\s*(?:packet\s*)?(?:loss|lost)/i
      );

      const lossPercentage = packetLossMatch
        ? parseFloat(packetLossMatch[1])
        : 0;

      const latencyValues = [
        ...code.matchAll(
          /(?:time|latency)[=<]?\s*(\d+(?:\.\d+)?)\s*ms/gi
        ),
      ].map((match) => parseFloat(match[1]));

      const timeoutCount = (
        code.match(/request\s+timed\s+out/gi) || []
      ).length;

      const successfulPacketCount = latencyValues.length;

      const totalPacketCount =
        successfulPacketCount + timeoutCount;

      const packetCount =
        totalPacketCount > 0
          ? totalPacketCount
          : 0;

      const lostPacketCount =
        packetCount > 0
          ? timeoutCount
          : 0;

      const pingDestinationMatch = code.match(
        /PING\s+([^\s(]+)/i
      );

      const destination =
        pingDestinationMatch?.[1] || "Destination";

      networkGraph = {
        source: "Your Host",
        destination,
        packets: Array.from(
          { length: packetCount },
          (_, index) => ({
            id: index + 1,
            status:
              index < successfulPacketCount
                ? "success"
                : "lost",
            ...(index < latencyValues.length
              ? {
                  latency: latencyValues[index],
                }
              : {}),
          })
        ),
        detected: networkAnalysis.detected,
      };

      evidence += `
DETERMINISTIC NETWORK ANALYSIS

Network issue detected: ${networkAnalysis.detected}

Packet loss percentage:
${lossPercentage}%

Successful packets:
${successfulPacketCount}

Lost packets:
${lostPacketCount}

Detected issues:
${
  networkAnalysis.issues
    .map(
      (issue) =>
        `${issue.type}: ${issue.evidence}
${issue.explanation}`
    )
    .join("\n") || "None detected"
}

Analyzer explanation:
${networkAnalysis.explanation}
`;

      structuredEvidence.checks.push({
        type: "Network Analysis",
        detected: networkAnalysis.detected,
        details:
          networkAnalysis.issues
            .map(
              (issue) =>
                `${issue.type}: ${issue.evidence}`
            )
            .join("\n") || "No network issues detected",
        explanation: networkAnalysis.explanation,
      });
    }

    // ==================================================
    // AI ANALYSIS
    // ==================================================

    const agent = mastra.getAgent("nightOwl");

    const result = await agent.generate(`
Domain:
${domain}

User's debugging input:

${code}

Deterministic analyzer evidence:

${evidence}

Use the deterministic evidence above as the primary source of truth.

Explain the root cause to the user clearly.

Do not claim that the code was executed.

If deterministic evidence identifies a problem, explain WHY that evidence indicates the problem.

Also explain the underlying systems concept and how to fix it.
`);

    // ==================================================
    // STRUCTURED AI RESPONSE
    // ==================================================

    let structuredAnalysis;

    try {
      structuredAnalysis = JSON.parse(result.text);
    } catch {
      structuredAnalysis = {
        problem: "Analysis",
        severity: "medium",
        rootCause: result.text,
        evidence:
          evidence ||
          "No deterministic evidence available.",
        whyItHappened:
          "See the analysis above.",
        suggestedFix:
          "Review the detected issue and apply the suggested correction.",
        concept: "Systems debugging",
        examMode: {
          definition:
            "No structured exam explanation was generated.",
          whyItHappened:
            "The AI response was not returned in the expected JSON format.",
          shortExamAnswer:
            "Review the deterministic evidence and AI analysis.",
          vivaQuestions: [],
        },
      };
    }

    // ==================================================
    // SAVE TO SUPABASE
    // ==================================================

    const examMode = structuredAnalysis.examMode ?? {
      definition: "",
      whyItHappened: "",
      shortExamAnswer: "",
      vivaQuestions: [],
    };

    const session = await prisma.debugSession.create({
      data: {
        domain,

        analysis: {
          create: {
            problem: structuredAnalysis.problem ?? "Analysis",
            severity: structuredAnalysis.severity ?? "medium",
            rootCause:
              structuredAnalysis.rootCause ?? "",
            evidence:
              structuredAnalysis.evidence ??
              evidence ??
              "",
            whyItHappened:
              structuredAnalysis.whyItHappened ?? "",
            suggestedFix:
              structuredAnalysis.suggestedFix ?? "",
            concept:
              structuredAnalysis.concept ?? "",
            definition:
              examMode.definition ?? "",
            examWhy:
              examMode.whyItHappened ?? "",
            shortExamAnswer:
              examMode.shortExamAnswer ?? "",
            vivaQuestions:
              examMode.vivaQuestions ?? [],
          },
        },
      },
      include: {
        analysis: true,
      },
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.json({
      success: true,
      sessionId: session.id,
      analysis: structuredAnalysis,
      evidence,
      structuredEvidence,
      deadlockGraph,
      raceGraph,
      networkGraph,
    });
  } catch (error) {
    console.error("Night-Owl agent error:", error);

    return res.status(500).json({
      error: "AI analysis failed.",
    });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `🦉 Night-Owl backend running on port ${PORT}`
  );
});