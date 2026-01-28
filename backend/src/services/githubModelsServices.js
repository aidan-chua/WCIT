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

        // First, check if it's actually a cat
        const catCheckResponse = await client.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "developer",
                    content: "You are an expert at identifying animals in images. Determine if the image contains a cat (domestic or wild like lions, tigers, etc.). Respond only with JSON."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Does this image contain a cat (domestic or wild)? Respond in JSON format:
{
  "isCat": true or false,
  "reason": "brief explanation"
}`
                        },
                        {
                            type: "image_url",
                            image_url: { url: dataUrl }
                        }
                    ]
                }
            ],
            max_tokens: 100,
        });
        
        // Parse cat check response
        const catCheckContent = catCheckResponse.choices[0]?.message?.content;
        let catCheck;
        try {
            const jsonMatch = catCheckContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                catCheck = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, assume it's a cat and proceed
                catCheck = { isCat: true };
            }
        } catch (parseError) {
            console.error("Error parsing cat check:", parseError);
            // If parsing fails, assume it's a cat and proceed
            catCheck = { isCat: true };
        }

        // If not a cat, throw error
        if (!catCheck.isCat) {
            const error = new Error("MEOWRRER404 Thats not a cat");
            error.isNotCat = true;
            error.reason = catCheck.reason || "The image does not contain a cat";
            throw error;
        }

        // If it is a cat, proceed with full identification
        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "developer",
                    content: "You are an expert at identifying cat breeds. Analyze cat images and provide detailed breed information."
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
  ],
  "rarity": "common" or "uncommon" or "rare" or "ultra rare",
  "difficulty": "easy" or "medium" or "hard" or "extreme",
  "placeOfOrigin": "Country or region where this breed originated"
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
        
        // Parse full identification response
        const content = response.choices[0]?.message?.content;

        // Add null check and better error handling
        if (!content) {
            console.error("AI response content is null or undefined");
            console.error("Full response:", JSON.stringify(response, null, 2));
            throw new Error("No response from AI");
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON response from AI");
        }
        
        const result = JSON.parse(jsonMatch[0]);
        
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