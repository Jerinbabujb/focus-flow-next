"use server";

import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: "us-east-1", // Keep this hardcoded so Nova is guaranteed to be found
});

export async function generateFinancialPlan(
  income: number,
  expenses: any[],
  goals: any[]
) {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingCash = income - totalExpenses;

  const systemPrompt = `
    You are a strict, analytical financial planner.
    
    USER CONTEXT:
    - Monthly Income: $${income}
    - Total Monthly Expenses: $${totalExpenses}
    - Remaining Cash Flow: $${remainingCash}
    
    EXPENSE HISTORY:
    ${JSON.stringify(expenses.map(e => ({ name: e.name, amount: e.amount, category: e.category })))}
    
    FUTURE GOALS:
    ${JSON.stringify(goals)}

    YOUR TASK:
    Analyze their expenses and future goals. Provide exactly 3 specific, actionable recommendations on how they can afford these goals. 
    You MUST suggest specific cutbacks from their actual Expense History (e.g., identifying high grocery spending, specific debts to prioritize, or manual lifestyle expenses to trim). Tell them exactly where to redirect that money.

    CRITICAL INSTRUCTION:
    Return your answer as a raw JSON array of strings. Do NOT include markdown blocks, preamble, or any other text.
    Example format: ["Tip 1", "Tip 2", "Tip 3"]
  `;

  try {
    // 1. We use the Converse API which natively supports Amazon Nova
    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0", // Bypasses the AWS Marketplace!
      messages: [
        {
          role: "user",
          content: [{ text: systemPrompt }]
        }
      ],
      inferenceConfig: {
        maxTokens: 1000,
        temperature: 0.5,
      }
    });

    const response = await bedrockClient.send(command);
    
    // 2. Parse the native Converse response
    const aiText = response.output?.message?.content?.[0]?.text || "[]";
    
    // 3. Clean and parse the AI's JSON array
    // We strip out any stray markdown codeblocks the AI might accidentally add
    const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Bedrock AI Error:", error);
    return ["We couldn't generate your plan at this time. Please check your AWS connection."];
  }
}