import express from "express";
import multer from "multer";
import {identifyCatBreed} from "../services/githubModelsServices.js";
import pool from "../db/connection.js";

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

        const deviceId = req.headers['x-device-id'] || 'unknown'; //Get device ID from header
        
        console.log('Processing image...');
        let identification;
        try {
            identification = await identifyCatBreed(
                req.file.buffer,
                req.file.mimetype
            );
        } catch (error) {
            //check if its the "not a cat" error
            if (error.isNotCat || error.message.includes("MEOWRRER404")) {
                return res.status(400).json({
                    error:"MEOWRRER 404: Not a cat",
                    reason: error.reason || "The image does not contain a cat"
                });
            }
            throw error;
        }

        const imageUrl = 'data:image/jpeg;base64,' + req.file.buffer.toString('base64');

        // Save to database
        const result = await pool.query(
            `INSERT INTO cat_identifications
            (device_id, image_url, breed_name, confidence, alternative_breeds, fun_facts, rarity, difficulty, place_of_origin)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, created_at`,
            [
                deviceId, 
                imageUrl,
                identification.breedName,
                identification.confidence,
                JSON.stringify(identification.alternativeBreeds || []),
                identification.funFacts || [],
                identification.rarity || "common",
                identification.difficulty || "easy",
                identification.placeOfOrigin || "Unknown"
            ]
        );

        res.json({
            id: result.rows[0].id.toString(),
            imageUrl: imageUrl,
            breedName: identification.breedName,
            confidence: identification.confidence,
            alternativeBreeds: identification.alternativeBreeds || [],
            funFacts: identification.funFacts || [],
            rarity: identification.rarity,
            difficulty: identification.difficulty,
            placeOfOrigin: identification.placeOfOrigin,
            createdAt: result.rows[0].created_at.toISOString(),
        });
    } catch (error) {
        console.error('Error identifying cat breed:', error);
        return res.status(500).json({error: 'Failed to identify cat breed. Please try again.'});
    }
});

router.get('/cats', async (req, res) => {
    try {
        const deviceId = req.headers['x-device-id'] || 'unknown';

        const result = await pool.query(
            `SELECT id, image_url, breed_name, confidence,
            alternative_breeds, fun_facts, rarity, difficulty, place_of_origin, created_at
            FROM cat_identifications
            WHERE device_id = $1
            ORDER BY created_at DESC`,
            [deviceId]
        );

        const cats = result.rows.map(row => ({
            id: row.id.toString(),
            imageUrl: row.image_url,
            breedName: row.breed_name,
            confidence: row.confidence,
            alternativeBreeds: row.alternative_breeds || [],
            funFacts: row.fun_facts || [],
            rarity: row.rarity || 'common',
            difficulty: row.difficulty || 'easy',
            placeOfOrigin: row.place_of_origin || 'Unknown',
            createdAt: row.created_at.toISOString(),
        }));

        res.json(cats);
    } catch (error) {
        console.error('Error fetching cats:', error);
        res.status(500).json({error: 'Failed to fetch cats'});
    }
});

export default router;