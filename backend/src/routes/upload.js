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
        const identification = await identifyCatBreed(
            req.file.buffer,
            req.file.mimetype
        );

        const imageUrl = 'data:image/jpeg;base64,' + req.file.buffer.toString('base64');

        // Save to database
        const result = await pool.query(
            `INSERT INTO cat_identifications
            (device_id, image_url, breed_name, confidence, alternative_breeds, fun_facts)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, created_at`,
            [
                deviceId, 
                imageUrl,
                identification.breedName,
                identification.confidence,
                JSON.stringify(identification.alternativeBreeds || []),
                identification.funFacts || []
            ]
        );

        res.json({
            id: result.rows[0].id.toString(),
            imageUrl: imageUrl,
            breedName: identification.breedName,
            confidence: identification.confidence,
            alternativeBreeds: identification.alternativeBreeds || [],
            funFacts: identification.funFacts || [],
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
            alternative_breeds, fun_facts, created_at
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
            createdAt: row.created_at.toISOString(),
        }));

        res.json(cats);
    } catch (error) {
        console.error('Error fetching cats:', error);
        res.status(500).json({error: 'Failed to fetch cats'});
    }
    });

export default router;