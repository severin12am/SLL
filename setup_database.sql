-- First, let's clean up any existing data
DELETE FROM translations;
DELETE FROM dialogue_steps;
DELETE FROM dialogue_scenarios;
DELETE FROM characters;
DELETE FROM languages;

-- Reset sequences
ALTER SEQUENCE languages_id_seq RESTART WITH 1;
ALTER SEQUENCE characters_id_seq RESTART WITH 1;
ALTER SEQUENCE dialogue_scenarios_id_seq RESTART WITH 1;
ALTER SEQUENCE dialogue_steps_id_seq RESTART WITH 1;
ALTER SEQUENCE translations_id_seq RESTART WITH 1;

-- Insert languages
INSERT INTO languages (code, name, native_name, is_active) VALUES
    ('en', 'English', 'English', true),
    ('es', 'Spanish', 'Español', true),
    ('ru', 'Russian', 'Русский', true),
    ('ar', 'Arabic', 'العربية', true);

-- Insert character (Market Vendor)
INSERT INTO characters (
    name,
    model_path,
    position_x,
    position_y,
    position_z,
    scale_x,
    scale_y,
    scale_z,
    is_active
) VALUES (
    'Market Vendor',
    'models/vendor.glb',
    2.5,
    -1,
    -1.5,
    0.2,
    0.2,
    0.2,
    true
);

-- Insert dialogue scenario
INSERT INTO dialogue_scenarios (character_id, scenario_order, is_active)
VALUES (1, 1, true);

-- Insert dialogue steps
INSERT INTO dialogue_steps (scenario_id, step_order, is_user_speaking) VALUES
    (1, 1, true),   -- User: How much is this?
    (1, 2, false),  -- Vendor: It's 50 dollars
    (1, 3, true),   -- User: Can I get a discount?
    (1, 4, false);  -- Vendor: I can give you 20% off

-- Add phonetic_text_ru, phonetic_text_ar, phonetic_text_es, phonetic_text_en columns if they don't exist
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE translations 
        ADD COLUMN phonetic_text_ru TEXT,
        ADD COLUMN phonetic_text_ar TEXT,
        ADD COLUMN phonetic_text_es TEXT,
        ADD COLUMN phonetic_text_en TEXT;
    EXCEPTION
        WHEN duplicate_column THEN 
            NULL;
    END;
END $$;

-- Insert translations for each step with language-specific phonetic transcriptions
-- Step 1: "How much is this?"
INSERT INTO translations (dialogue_step_id, language_id, text, phonetic_text, phonetic_text_ru, phonetic_text_ar, phonetic_text_es, phonetic_text_en) VALUES
    (1, (SELECT id FROM languages WHERE code = 'en'), 'How much is this?', 'hau mʌtʃ ɪz ðɪs', 'хау мач из зыс', 'هاو ماتش إز ذِس', 'jau mach is dis', 'how much is this'),
    (1, (SELECT id FROM languages WHERE code = 'es'), '¿Cuánto cuesta esto?', 'kwanto kwesta esto', 'куанто куэста эсто', 'كوانتو كويستا استو', 'cuanto cuesta esto', 'kwanto kwesta esto'),
    (1, (SELECT id FROM languages WHERE code = 'ru'), 'Сколько это стоит?', 'skolka eta stoit', 'сколько это стоит', 'سكولكو إتو ستويت', 'skolko eto stoit', 'skolko eto stoit'),
    (1, (SELECT id FROM languages WHERE code = 'ar'), 'بكم هذا؟', 'bikam hatha', 'бикам хаза', 'بكم هذا', 'bikam haza', 'bikam hatha');

-- Step 2: "It's 50 dollars"
INSERT INTO translations (dialogue_step_id, language_id, text, phonetic_text, phonetic_text_ru, phonetic_text_ar, phonetic_text_es, phonetic_text_en) VALUES
    (2, (SELECT id FROM languages WHERE code = 'en'), 'It''s 50 dollars', 'ɪts ˈfɪfti ˈdɒləz', 'итс фифти доларз', 'إتس فيفتي دولارز', 'its fifti dolars', 'its fifty dollars'),
    (2, (SELECT id FROM languages WHERE code = 'es'), 'Son 50 dólares', 'son sinkwenta dolares', 'сон синкуэнта доларес', 'سون سينكوينتا دولاريس', 'son cincuenta dolares', 'son sinkwenta dolares'),
    (2, (SELECT id FROM languages WHERE code = 'ru'), 'Это 50 долларов', 'eta pyatdesyat dollarov', 'это пятьдесят долларов', 'إتو بياتديسيات دولاروف', 'eto pyatdesyat dolarov', 'eto pyatdesyat dollarov'),
    (2, (SELECT id FROM languages WHERE code = 'ar'), 'إنه خمسون دولارا', 'innahu khamsun dolaran', 'иннаху хамсун доларан', 'إنه خمسون دولارا', 'innaju jamsun dolaran', 'innahu khamsun dolaran');

-- Step 3: "Can I get a discount?"
INSERT INTO translations (dialogue_step_id, language_id, text, phonetic_text, phonetic_text_ru, phonetic_text_ar, phonetic_text_es, phonetic_text_en) VALUES
    (3, (SELECT id FROM languages WHERE code = 'en'), 'Can I get a discount?', 'kæn aɪ ɡɛt ə ˈdɪskaʊnt', 'кэн ай гет э дискаунт', 'كان آي غيت آ ديسكاونت', 'can ai get a discount', 'can i get a discount'),
    (3, (SELECT id FROM languages WHERE code = 'es'), '¿Puedo obtener un descuento?', 'pwedo obtener un deskwento', 'пуэдо обтенер ун дескуэнто', 'بويدو أوبتينير أون ديسكوينتو', 'puedo obtener un descuento', 'pwedo obtener un deskwento'),
    (3, (SELECT id FROM languages WHERE code = 'ru'), 'Можно получить скидку?', 'mozhna paluchit skidku', 'можно получить скидку', 'موجنو بولوتشيت سكيدكو', 'mozhno poluchit skidku', 'mozhna paluchit skidku'),
    (3, (SELECT id FROM languages WHERE code = 'ar'), 'هل يمكنني الحصول على خصم؟', 'hal yumkinuni alhusul ala khasm', 'халь юмкинуни альхусуль аля хасм', 'هل يمكنني الحصول على خصم', 'hal yumkinuni aljusul ala jasm', 'hal yumkinuni alhusul ala khasm');

-- Step 4: "I can give you 20% off"
INSERT INTO translations (dialogue_step_id, language_id, text, phonetic_text, phonetic_text_ru, phonetic_text_ar, phonetic_text_es, phonetic_text_en) VALUES
    (4, (SELECT id FROM languages WHERE code = 'en'), 'I can give you 20% off', 'aɪ kæn ɡɪv ju ˈtwɛnti pəˈsɛnt ɔf', 'ай кэн гив ю твенти персент оф', 'آي كان غيف يو تْوِنتي بِرسِنت أوف', 'ai can giv yu tuenti percent of', 'i can give you twenty percent off'),
    (4, (SELECT id FROM languages WHERE code = 'es'), 'Puedo darte un 20% de descuento', 'pwedo darte un beinte por siento de deskwento', 'пуэдо дартэ ун бэинтэ пор сьенто дэ дэскуэнто', 'بويدو دارتي أون بينتي بور سيينتو دي ديسكوينتو', 'puedo darte un veinte por ciento de descuento', 'pwedo darte un beinte por siento de deskwento'),
    (4, (SELECT id FROM languages WHERE code = 'ru'), 'Я могу дать скидку 20%', 'ya magu dat skidku dvadtsat protsentov', 'я могу дать скидку двадцать процентов', 'يا موغو دات سكيدكو دفادتسات بروتسينتوف', 'ya mogu dat skidku dvadtsat protsentov', 'ya magu dat skidku dvadtsat protsentov'),
    (4, (SELECT id FROM languages WHERE code = 'ar'), 'يمكنني منحك خصم 20%', 'yumkinuni manhuka khasm ishrin bilmi''a', 'юмкинуни манхука хасм ишрин бильмиа', 'يمكنني منحك خصم عشرين بالمئة', 'yumkinuni manjuka jasm ishrin bilmia', 'yumkinuni manhuka khasm ishrin bilmia');

-- Add any necessary indexes
CREATE INDEX IF NOT EXISTS idx_translations_step_lang ON translations(dialogue_step_id, language_id);
CREATE INDEX IF NOT EXISTS idx_steps_scenario ON dialogue_steps(scenario_id);

-- Verify the data
SELECT 
    ds.step_order,
    ds.is_user_speaking,
    l.code as language,
    t.text,
    t.phonetic_text,
    t.phonetic_text_ru,
    t.phonetic_text_ar,
    t.phonetic_text_es,
    t.phonetic_text_en
FROM dialogue_steps ds
JOIN translations t ON t.dialogue_step_id = ds.id
JOIN languages l ON l.id = t.language_id
ORDER BY ds.step_order, l.code; 