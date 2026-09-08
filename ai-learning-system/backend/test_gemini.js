require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  console.log("Testing text generation...");
  try {
    const systemInstruction = "Hello";
    const finalModel = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction
    });
    
    const chat = finalModel.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 1500 },
    });

    const resultStream = await chat.sendMessageStream(["123+123"]);

    let fullResponseText = '';
    for await (const chunk of resultStream.stream) {
      let chunkText = chunk.text();
      console.log("Chunk:", chunkText);
    }
    console.log("Done");
  } catch (e) {
    console.error("Stream error:", e.message);
  }
}

test();
