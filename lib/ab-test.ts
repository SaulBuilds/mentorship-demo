import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { StateGraph } from "@langchain/langgraph";
import { AgentEntity } from "@/lib/agent"; // if you want to use your agent
import { CentralOracle } from "@/lib/oracle";

/** 
 * Optional: Decide if we use an "oracle" or not
 */
export function OracleOrNoOracle(): boolean {
  return false;
}

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
 * Workflow's state shape
 */
export interface GraphState {
  messages: BaseMessage[];
}

/** 
 * Extra config to see if "mentor" is enabled or not
 */
export interface ABTestConfig extends RunnableConfig {
  isMentor?: boolean;
}

/** 
 * 1) MentorCheckNode
 *    - If isMentor is true, prepend a "mentor" message
 */
class MentorCheckNode extends Runnable<GraphState, Partial<GraphState>, ABTestConfig> {
  public lc_namespace = ["MentorCheckNode"];

  async invoke(
    state: GraphState,
    config?: ABTestConfig
  ): Promise<Partial<GraphState>> {
    const isMentor = config?.isMentor ?? false;
    console.log("[MentorCheckNode] isMentor =", isMentor);

    if (isMentor) {
      // If mentor is on, we add a special mentor message
      const mentorPrompt = new HumanMessage("Mentor: Provide guidance for a technical task.");
      return { messages: [mentorPrompt] };
    } else {
      // If no mentor, do nothing. Return an empty partial.
      return {};
    }
  }
}

/** 
 * 2) OracleCheckNode
 *    - Possibly read or update the Oracle with knowledge
 */
class OracleCheckNode extends Runnable<GraphState, Partial<GraphState>, ABTestConfig> {
  public lc_namespace = ["OracleCheckNode"];

  async invoke(
    state: GraphState,
    _config?: ABTestConfig
  ): Promise<Partial<GraphState>> {
    const oracle = CentralOracle.getInstance();
    console.log("[OracleCheckNode] existing knowledge:", oracle.getAllKnowledge());

    // For demo: store a placeholder
    oracle.updateKnowledge("tech_task", "We want to code a basic function in JavaScript.");

    // Add a system message about the oracle usage
    const systemMsg = new HumanMessage(
      "System: The Oracle has stored a new piece of knowledge about our coding task."
    );
    return { messages: [systemMsg] };
  }
}

/** 
 * 3) CodingTaskNode
 *    - Actually calls ChatOpenAI referencing the aggregator messages
 */
class CodingTaskNode extends Runnable<GraphState, Partial<GraphState>, ABTestConfig> {
  public lc_namespace = ["CodingTaskNode"];

  async invoke(
    state: GraphState,
    config?: ABTestConfig
  ): Promise<Partial<GraphState>> {
    const { messages } = state;
    console.log("[CodingTaskNode] we have so far", messages.length, "messages.");

    // Optionally use your AgentEntity if you want:
    const agent = new AgentEntity(
      1, 
      "CoderAgent", 
      "mentee", 
      0, 
      999 // some mentor ID
    );
    agent.requestGuidance(); // just for demonstration

    const model = new ChatOpenAI({ modelName: "gpt-4", temperature: 0.5 });
    const codingPrompt = new HumanMessage(
      "Task: Please write a basic JavaScript function that returns the square of a number."
    );
    const response = await model.invoke([...messages, codingPrompt]);
    return { messages: [response] };
  }
}

/** 
 * We create single instances of each node
 */
const mentorCheckNode = new MentorCheckNode();
const oracleCheckNode = new OracleCheckNode();
const codingTaskNode = new CodingTaskNode();

/** 
 * createABTestWorkflow()
 *   - aggregator channels
 *   - nodes: "mentorNode", "oracleNode", "codingNode"
 *   - edges from __start__ -> mentorNode -> oracleNode -> codingNode -> __end__
 */
export function createABTestWorkflow() {
  const workflow = new StateGraph<GraphState>({ channels });

  // addNode(nodeKey, Runnable)
  workflow.addNode("mentorNode", mentorCheckNode);
  workflow.addNode("oracleNode", oracleCheckNode);
  workflow.addNode("codingNode", codingTaskNode);

  // addEdge(fromKey, toKey)
  workflow.addEdge("__start__", "mentorNode");
  workflow.addEdge("mentorNode", "oracleNode");
  workflow.addEdge("oracleNode", "codingNode");
  workflow.addEdge("codingNode", "__end__");

  return workflow.compile();
}

/**
 * runABTest():
 * - Takes an array of BaseMessage
 * - Tells if "isMentor" is enabled
 * - aggregator merges partial updates => final { messages }
 */
export async function runABTest(
  threadId: string,
  initialMessages: BaseMessage[],
  isMentorEnabled: boolean
) {
  const initialState: GraphState = {
    messages: initialMessages,
  };

  const config: ABTestConfig = {
    isMentor: isMentorEnabled,
    tags: [`thread:${threadId}`, OracleOrNoOracle() ? "oracle_on" : "oracle_off"],
  };

  const workflow = createABTestWorkflow();
  const finalState = await workflow.invoke(initialState, config);
  return finalState.messages; // final array of messages
}
