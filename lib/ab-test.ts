/* eslint-disable @typescript-eslint/ban-ts-comment */
/////////////////////////
// ab-test.ts (excerpt)
/////////////////////////

import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { StateGraph } from "@langchain/langgraph";
import { AgentEntity } from "@/lib/agent";
import { CentralOracle } from "@/lib/oracle";

/** 
 * aggregator channels for “messages”
 */
const channels = {
  messages: {
    value: (oldVal: BaseMessage[], newVal: BaseMessage[]) => [...oldVal, ...newVal],
    default: () => [],
  },
};

/** 
 * Workflow state
 */
export interface GraphState {
  messages: BaseMessage[];
}

/** 
 * Additional config
 */
export interface ABTestConfig extends RunnableConfig {
  isMentor?: boolean;
}

/** 
 * 1) MentorCheckNode
 *    - Dynamically crafts a “mentor” prompt referencing the agent or oracle
 */
class MentorCheckNode extends Runnable<GraphState, Partial<GraphState>, ABTestConfig> {
  public lc_namespace = ["MentorCheckNode"];

  async invoke(state: GraphState, config?: ABTestConfig): Promise<Partial<GraphState>> {
    const isMentor = config?.isMentor ?? false;
    console.log("[MentorCheckNode] isMentor =", isMentor);

    if (!isMentor) {
      // no mentor, do nothing
      return {};
    }

    // Example usage of AgentEntity for a “mentor” agent
    // Possibly fetched from DB in real code
    const mentorAgent = new AgentEntity(100, "SeniorDev", "mentor", 20);
    mentorAgent.shareKnowledgeWithOracle("mentorTips", "Always test code thoroughly.");

    const oracle = CentralOracle.getInstance();
    const mentorTips = oracle.getKnowledge("mentorTips") || "No mentor tips yet.";

    // Combine aggregator's last message (if any) with mentor tips
    const lastUserMsg = state.messages.length > 0 
      ? state.messages[state.messages.length - 1].text 
      : "No prior user message";

    // Construct a more advanced “mentor” prompt
    const mentorPromptText = `
      Mentor: Provide guidance based on these tips: ${mentorTips}.
      The user previously said: "${lastUserMsg}".
      Please give them step-by-step mentorship.
    `.trim();

    const mentorPrompt = new HumanMessage(mentorPromptText);

    return { messages: [mentorPrompt] };
  }
}

/**
 * 2) OracleCheckNode
 *    - Dynamically checks the aggregator for relevant context
 *    - Reads/writes to the Oracle
 */
class OracleCheckNode extends Runnable<GraphState, Partial<GraphState>, ABTestConfig> {
  public lc_namespace = ["OracleCheckNode"];

  async invoke(state: GraphState, _config?: ABTestConfig): Promise<Partial<GraphState>> {
    console.log("[OracleCheckNode] aggregator has", state.messages.length, "messages so far.");

    // Possibly parse aggregator for keywordßs or user intent
    const lastMsg = state.messages[state.messages.length - 1]?.text || "No last message";
    const oracle = CentralOracle.getInstance();

    // If user asked about “React” or “Node.js” or something, store that knowledge
    if (lastMsg.toLowerCase().includes("react")) {
      oracle.updateKnowledge("framework", "React");
    } else if (lastMsg.toLowerCase().includes("node.js")) {
      oracle.updateKnowledge("framework", "Node.js");
    } else {
      oracle.updateKnowledge("framework", "Vanilla JS");
    }

    // Return a system message summarizing the new knowledge
    const currentFramework = oracle.getKnowledge("framework");
    const sysMsg = new HumanMessage(
      `System: Oracle recognized the user might want to use ${currentFramework} for coding.`
    );

    return { messages: [sysMsg] };
  }
}

/**
 * 3) GenerateCodeNode
 *    - Example final code generation node
 */
class GenerateCodeNode extends Runnable<GraphState, Partial<GraphState>, ABTestConfig> {
  public lc_namespace = ["GenerateCodeNode"];

  async invoke(state: GraphState): Promise<Partial<GraphState>> {
    console.log("[GenerateCodeNode] aggregator messages =>", state.messages.length);

    const oracle = CentralOracle.getInstance();
    const chosenFramework = oracle.getKnowledge("framework") || "Vanilla JS";

    // Possibly build a dynamic prompt referencing aggregator + chosenFramework
    const codePrompt = new HumanMessage(
      `Task: Please generate a code snippet in ${chosenFramework} that addresses the user's last request.`
    );

    const model = new ChatOpenAI({ modelName: "gpt-4", temperature: 0.5 });
    const response = await model.invoke([...state.messages, codePrompt]);

    return { messages: [response] };
  }
}

// Instances
const mentorNode = new MentorCheckNode();
const oracleNode = new OracleCheckNode();
const genNode = new GenerateCodeNode();

/**
 * createABTestWorkflow:
 * - aggregator channels
 * - node keys w/ @ts-ignore if library restricts custom keys
 */
export function createABTestWorkflow() {
  const workflow = new StateGraph<GraphState>({ channels });

  // Possibly your library allows only __start__/__end__ typed node keys
  // so we do a ts-ignore or cast
  // @ts-ignore
  workflow.addNode("mentorNode", mentorNode);
  // @ts-ignore
  workflow.addNode("oracleNode", oracleNode);
  // @ts-ignore
  workflow.addNode("generateNode", genNode);

  // addEdge
  // @ts-ignore
  workflow.addEdge("__start__", "mentorNode");
  // @ts-ignore
  workflow.addEdge("mentorNode", "oracleNode");
  // @ts-ignore
  workflow.addEdge("oracleNode", "generateNode");
  // @ts-ignore
  workflow.addEdge("generateNode", "__end__");

  return workflow.compile();
}

export async function runABTest(
  threadId: string,
  initialMessages: BaseMessage[],
  isMentorEnabled: boolean
) {
  console.log("Running AB test for thread:", threadId);

  const initialState: GraphState = {
    messages: initialMessages,
  };

  const config: ABTestConfig = {
    isMentor: isMentorEnabled,
    tags: [`thread:${threadId}`],
  };

  const workflow = createABTestWorkflow();
  const finalState = await workflow.invoke(initialState, config);
  return finalState.messages;
}
