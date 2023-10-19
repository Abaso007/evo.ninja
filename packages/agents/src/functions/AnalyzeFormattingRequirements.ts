import { Agent, AgentFunctionResult, ChatMessageBuilder, LlmApi, Tokenizer } from "@evo-ninja/agent-utils";
import { AgentBaseContext } from "../AgentBase";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";

interface AnalyzeFormattingRequirementsParameters {
  goal: string;
}

export class AnalyzeFormattingRequirementsFunction extends LlmAgentFunctionBase<AnalyzeFormattingRequirementsParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "analyzeFormattingRequirements";
  description: string = "Analyzes the requirements of a user defined goal";
  parameters: any = {
    type: "object",
    properties: {
      goal: {
        type: "string",
        description: "The user's goal"
      }
    },
    required: ["goal"],
    additionalProperties: false
  };

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: AnalyzeFormattingRequirementsParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: AnalyzeFormattingRequirementsParameters, rawParams?: string): Promise<AgentFunctionResult> => {

      const resp = await this.askLlm(`Given the following user goal, please identify any formatting requirements:\n\`\`\`\n${params.goal}\n\`\`\``);
      
      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ...ChatMessageBuilder.functionCallResultWithVariables(this.name, resp, context.variables)
        ]
      };
    }
  }
}