import OpenAI from "openai";

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("❌ Error: GITHUB_TOKEN environment variable is not set!");
  console.log("Please set it using: $Env:GITHUB_TOKEN='your-token-here'");
  process.exit(1);
}
const endpoint = "https://models.github.ai/inference";

// Try these model names
const modelsToTry = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "openai/gpt-4-turbo",
  "openai/gpt-3.5-turbo",
  "gpt-4o-mini",
  "gpt-4o",
];

const client = new OpenAI({ 
  baseURL: endpoint, 
  apiKey: token 
});

async function testModel(modelName) {
  try {
    console.log(`\n🧪 Testing model: ${modelName}`);
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "developer", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'Hello, this model works!'" }
      ],
    });
    
    console.log(`✅ ${modelName} works!`);
    console.log(`Response: ${response.choices[0].message.content}`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName} failed: ${error.message}`);
    return false;
  }
}

async function testAllModels() {
  console.log("Testing available GitHub Models...\n");
  
  for (const model of modelsToTry) {
    const success = await testModel(model);
    if (success) {
      console.log(`\n🎉 Found working model: ${model}`);
      break;
    }
  }
}

testAllModels();