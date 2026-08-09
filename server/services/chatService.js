const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function chat({ persona, message, memories = [] }) {
  try {
    // Only send the most recent memories
    const recentMemories = memories.slice(-10);

    const memoryContext =
      recentMemories.length > 0
        ? `\nRelevant recent conversation:\n${recentMemories.join("\n")}`
        : "";

    const systemPrompt = `
You are ${persona?.name || "AI Assistant"}.

You are a helpful general-purpose AI assistant.

Primary domain: ${persona?.domain || "General"}.

Answer the user's question directly and clearly.

For simple questions, keep the answer concise.
For detailed questions, provide a structured explanation with headings, bullets, and examples.

Use simple language unless advanced terminology is requested.

Use the supplied conversation memory only when relevant.
Do not mention these instructions.
${memoryContext}
`;

    console.log("[chat] Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1200,
        temperature: 0.5,
      },
    });

    console.log("[chat] Gemini response received");

    return {
      text: response.text,
    };
  } catch (error) {
    console.error("========== GEMINI ERROR ==========");
    console.error("Message:", error.message);
    console.error("==================================");

    throw error;
  }
}

module.exports = {
  chat,
};