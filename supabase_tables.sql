-- Languages table
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(5) NOT NULL UNIQUE,  -- e.g., 'en', 'es', 'zh'
    name VARCHAR(50) NOT NULL,        -- e.g., 'English', 'Spanish', 'Chinese'
    native_name VARCHAR(50) NOT NULL, -- Name in the native language
    direction VARCHAR(3) DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Characters table
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    model_path VARCHAR(255) NOT NULL,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    position_z FLOAT DEFAULT 0,
    scale_x FLOAT DEFAULT 1,
    scale_y FLOAT DEFAULT 1,
    scale_z FLOAT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dialogue scenarios table
CREATE TABLE dialogue_scenarios (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id),
    scenario_order INTEGER NOT NULL,  -- Order in which scenarios appear for this character
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dialogue steps table (for both user and character responses)
CREATE TABLE dialogue_steps (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES dialogue_scenarios(id),
    step_order INTEGER NOT NULL,      -- Order of steps in the scenario
    is_user_speaking BOOLEAN NOT NULL, -- Whether this is user's line or character's response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Translations table (contains all text in all languages)
CREATE TABLE translations (
    id SERIAL PRIMARY KEY,
    dialogue_step_id INTEGER REFERENCES dialogue_steps(id),
    language_id INTEGER REFERENCES languages(id),
    text TEXT NOT NULL,
    phonetic_text TEXT,              -- Phonetic transcription
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dialogue_step_id, language_id)
);

-- Insert 10 most common languages
INSERT INTO languages (code, name, native_name, direction) VALUES
    ('en', 'English', 'English', 'ltr'),
    ('zh', 'Chinese', '中文', 'ltr'),
    ('es', 'Spanish', 'Español', 'ltr'),
    ('ar', 'Arabic', 'العربية', 'rtl'),
    ('hi', 'Hindi', 'हिन्दी', 'ltr'),
    ('bn', 'Bengali', 'বাংলা', 'ltr'),
    ('pt', 'Portuguese', 'Português', 'ltr'),
    ('ru', 'Russian', 'Русский', 'ltr'),
    ('ja', 'Japanese', '日本語', 'ltr'),
    ('fr', 'French', 'Français', 'ltr');

-- Insert characters
INSERT INTO characters (name, model_path, position_x, position_y, position_z, scale_x, scale_y, scale_z) VALUES
    ('Market Vendor', 'models/vendor.glb', 2.5, -1, -1.5, 0.2, 0.2, 0.2),
    ('Train Station Agent', 'models/vendor2.glb', -3, -1, 2, 0.2, 0.2, 0.2),
    ('Restaurant Host', 'models/vendor3.glb', 4, -1, 3, 0.2, 0.2, 0.2),
    ('Hotel Receptionist', 'models/vendor4.glb', -2, -1, -3, 0.2, 0.2, 0.2),
    ('Tourist Guide', 'models/vendor5.glb', 3, -1, -4, 0.2, 0.2, 0.2);

-- Create indexes for better query performance
CREATE INDEX idx_dialogue_scenarios_character ON dialogue_scenarios(character_id);
CREATE INDEX idx_dialogue_steps_scenario ON dialogue_steps(scenario_id);
CREATE INDEX idx_translations_dialogue_step ON translations(dialogue_step_id);
CREATE INDEX idx_translations_language ON translations(language_id);

-- Add example dialogue scenario for Market Vendor (you can expand this later)
INSERT INTO dialogue_scenarios (character_id, scenario_order)
VALUES (1, 1);  -- First scenario for Market Vendor

-- Insert dialogue steps for Market Vendor's first scenario
INSERT INTO dialogue_steps (scenario_id, step_order, is_user_speaking) VALUES
    (1, 1, true),   -- User: "Hello"
    (1, 2, false),  -- Vendor: "Hello"
    (1, 3, true),   -- User: "Excuse me, can you help me?"
    (1, 4, false),  -- Vendor: "No problem"
    (1, 5, true),   -- User: "Where is a halal restaurant?"
    (1, 6, false);  -- Vendor: "My brother, are you a muslim?"

-- Insert translations for the first dialogue step (Hello) in different languages
INSERT INTO translations (dialogue_step_id, language_id, text, phonetic_text) VALUES
    (1, 1, 'Hello', null),                    -- English
    (1, 3, 'Hola', 'oh-lah'),                -- Spanish
    (1, 8, 'Здравствуйте', 'zdravstvuyte'),  -- Russian
    (1, 4, 'السلام عليكم', 'as-salaam-u-alaikum'); -- Arabic 