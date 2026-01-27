-- Create table for cat identifications
CREATE TABLE IF NOT EXISTS cat_identifications (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    breed_name VARCHAR(255) NOT NULL,
    confidence INTEGER NOT NULL,
    alternative_breeds JSONB,
    fun_facts TEXT[],
    rarity VARCHAR(50),
    difficulty VARCHAR(50),
    place_of_origin TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by device_id
CREATE INDEX IF NOT EXISTS idx_device_id ON cat_identifications(device_id);

-- Create index for faster queries by created_at
CREATE INDEX IF NOT EXISTS idx_crated_at ON cat_identifications(created_at DESC);