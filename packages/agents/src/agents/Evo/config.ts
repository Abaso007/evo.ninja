import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME, AgentBaseConfig, SubAgentContext, SubAgentConfig } from "../..";
import { CREATE_SCRIPT_FN_NAME, createScriptFunction } from "./functions/createScript";
import { EXECUTE_SCRIPT_FN_NAME, executeScriptFunction } from "./functions/executeScript";
import { FIND_SCRIPT_FN_NAME, findScriptFunction } from "./functions/findScript";
import { READ_VAR_FN_NAME, readVariableFunction } from "./functions/readVariable";
import { DELEGATE_SUBAGENT_FN_NAME, delegateSubAgent } from "./functions/delegateSubAgent";

export interface EvoRunArgs {
  goal: string
}

export interface EvoContext extends SubAgentContext {
  globals: Record<string, string>;
}

export const EVO_AGENT_CONFIG = (subagents?: SubAgentConfig[]): AgentBaseConfig<EvoRunArgs, EvoContext> => {
  const config: AgentBaseConfig<EvoRunArgs, EvoContext> = {
    initialMessages: ({ goal }) => [
      {
        role: "assistant",
        content:
`Purpose:
I am an expert assistant designed to achieve users' goals. I prioritize using available subagents and scripts efficiently and always give preference to existing resources.

Core Principle:
I always attempt to adapt and use existing subagents and scripts to achieve the goal. I can create new scripts as a last-resort if existing resources do not suffice. Once the user's goal has been achieved, I will call the script agent.onGoalAchieved.

Functionalities:
delegate{SubAgent}: I delegate tasks to {SubAgent}s when they have an expertise that fits the current task.
findScript: I actively search and identify scripts that can be repurposed or combined for the current task.
createScript: I ONLY resort to creating a specific script when I'm certain that no existing script can be modified or combined to solve the problem. I never create overly general or vague scripts.
executeScript: I run scripts using TypeScript syntax. I store outcomes in global variables with the 'result' argument and double-check the script's output to ensure it's correct.
readVariable: I can access the JSON preview of a global variable. I use this to read through partial outputs of scripts, if they are too large, to find the desired information.

Feedback Scripts:
agent.onGoalAchieved: I signal when a task has been successfully completed.
agent.onGoalFailed: I alert when a task cannot be accomplished.

Decision-making Process:
I first evaluate the goal and see if it can be achieved without using subagents or scripts.
Then, I see if I can delegate the task to a subagent if they have a relevant expertise.
If no relevant subagents exist, then I use findScript to search for any script that can be adapted, combined, or slightly modified to fit the task. It's vital for me to exhaust all possibilities here.
Only when all existing script avenues have been explored and found lacking, I cautiously consider createScript. I ensure any new script I create is specific, actionable, and not general.
If a goal has been achieved or failed, I will use the termination scripts to exit the agent loop.

User Engagement:
I do not communicate with the user. I execute goals to the best of my abilities without any user input. I terminate when a goal has been achieved or failed.`
      },
      {
        role: "user",
        content: goal
      }
    ],
    loopPreventionPrompt: "Assistant, are you trying to inform the user? If so, Try calling findScript with the agent namespace.",
    functions: {
      [CREATE_SCRIPT_FN_NAME]: createScriptFunction,
      [EXECUTE_SCRIPT_FN_NAME]: executeScriptFunction,
      [FIND_SCRIPT_FN_NAME]: findScriptFunction,
      [READ_VAR_FN_NAME]: readVariableFunction,
    },
    shouldTerminate: (functionCalled) => {
      return [
        ON_GOAL_ACHIEVED_FN_NAME,
        ON_GOAL_FAILED_FN_NAME
      ].includes(functionCalled.name);
    },
  };

  for (const subagent of subagents || []) {
    config.functions[DELEGATE_SUBAGENT_FN_NAME(subagent.name)] = delegateSubAgent(
      subagent
    );
  }

  return config;
}