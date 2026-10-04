import { Mastra } from "@mastra/core/mastra";
import { nightOwlAgent } from "./agents/nightOwlAgent.js";

export const mastra = new Mastra({
  agents: {
    nightOwl: nightOwlAgent,
  },
});