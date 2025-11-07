import express from "express";
import multer from "multer";
import {identifyCatBreed} from "../services/githubModelsServices.js";

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 10 * 1024 * 1024}, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
});

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({error: 'No image file provided'})
        }
        
        console.log('Processing image...');
        const identification = await identifyCatBreed(
            req.file.buffer,
            req.file.mimetype
        );

        res.json({
            id: Date.now().toString(),
            imageUrl: 'data:image/jpeg;base64,' + req.file.buffer.toString('base64'),
            breedName: identification.breedName,
            confidence: identification.confidence,
            alternativeBreeds: identification.alternativeBreeds || [],
            funFacts: identification.funFacts || [],
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error identifying cat breed:', error);
        return res.status(500).json({error: 'Failed to identify cat breed. Please try again.'});
    }
});

export default router;