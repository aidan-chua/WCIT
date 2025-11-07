import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o-mini";

export async function identifyCatBreed(imageBuffer, imageMimeType) {
    try {
        const client = new OpenAI({
            baseURL: endpoint,
            apiKey: token
        });

        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:${imageMimeType};base64,${base64Image}`;

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "developer",
                    content: "You are a cat breed identification expert. Analyze cat images and identify breeds with confidence scores. Give 3 other cats as possible likelhoods. Lastly give 3 fun facts about the cat with the highest likelihood score"
                },
                { 
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this cat image and identify the breed. Respond in JSON format with this exact structure:
{
  "breedName": "Primary breed name",
  "confidence": 85,
  "alternativeBreeds": [
    {"breed": "Breed name", "percentage": 10}
  ],
  "funFacts": [
    "Fact 1 about this breed",
    "Fact 2 about this breed",
    "Fact 3 about this breed"
  ]
}`
                        },
                        {
                            type: "image_url",
                            image_url: { url: dataUrl }
                        }
                    ]
                }
            ],
            max_tokens: 500,
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No response from model");

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid JSON response from model");

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("GitHub Models Error:", error);
        throw error;
    }
}