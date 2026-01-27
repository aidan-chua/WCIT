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

        // First, check if its actually a cat
        const catCheckResponse = await client.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "developer",
                    content: "You are an expert at identifying animals in images. Determine if the image contains a cat (domestic or wild like lions, tigers, etc.)."
                },
                {
                    role: "user",
                    content: [
                        {
                            type:"text",
                            text:`Analyze this cat image and identify the breed.Respond in JSON format with this exact structure:

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
  ],
  "rarity": "common" or "uncommon" or "rare" or "ultra rare",
  "difficulty": "easy" or "medium" or "hard" or "extreme",
  "placeOfOrigin: "Country or refion where this breed originated"
}
  Important:
- rarity: "common" for very common breeds, "uncommon" for less common, "rare" for rare breeds, "ultra rare" for extremely rare or exotic breeds
- difficulty: "easy" for typical house cats, "medium" for breeds requiring some special care, "hard" for breeds with significant care requirements, "extreme" for undomesticated cats like lions, tigers, cheetahs, etc.
- placeOfOrigin: The country or region where this breed originated (e.g., "Thailand", "Egypt", "United States", "Africa" for wild cats)`
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
        // Validate and set defaults
        return {
            breedName: result.breedName || "Unknown",
            confidence: result.confidence || 0,
            alternativeBreeds: result.alternativeBreeds || [],
            funFacts: result.funFacts || [],
            rarity: result.rarity || "common",
            difficulty: result.difficulty || "easy",
            placeOfOrigin: result.placeOfOrigin || "Unknown"
        };
    } catch (error) {
        console.error("GitHub Models Error:", error);
        throw error;
    }
}