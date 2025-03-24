// Supabase setup script
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fjvltffpcafcbbpwzyml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdmx0ZmZwY2FmY2JicHd6eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MjUxNTQsImV4cCI6MjA1ODAwMTE1NH0.uuhJLxTJL26r2jfD9Cb5IMKYaScDNsJeHYJue4pfWRk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
    try {
        // 1. Insert languages
        const { data: languages, error: langError } = await supabase
            .from('languages')
            .upsert([
                { code: 'en', name: 'English', is_active: true },
                { code: 'es', name: 'Spanish', is_active: true },
                { code: 'ru', name: 'Russian', is_active: true },
                { code: 'ar', name: 'Arabic', is_active: true }
            ]);

        if (langError) throw langError;
        console.log('Languages inserted successfully');

        // 2. Insert character
        const { data: character, error: charError } = await supabase
            .from('characters')
            .upsert([
                {
                    id: 1,
                    name: 'Market Vendor',
                    model_path: 'models/vendor.glb',
                    position_x: 2.5,
                    position_y: -1,
                    position_z: -1.5,
                    scale_x: 0.2,
                    scale_y: 0.2,
                    scale_z: 0.2,
                    is_active: true
                }
            ]);

        if (charError) throw charError;
        console.log('Character inserted successfully');

        // 3. Insert dialogue scenario
        const { data: scenario, error: scenarioError } = await supabase
            .from('dialogue_scenarios')
            .upsert([
                {
                    id: 1,
                    character_id: 1,
                    scenario_order: 1,
                    is_active: true
                }
            ]);

        if (scenarioError) throw scenarioError;
        console.log('Scenario inserted successfully');

        // 4. Insert dialogue steps
        const { data: steps, error: stepsError } = await supabase
            .from('dialogue_steps')
            .upsert([
                {
                    id: 1,
                    scenario_id: 1,
                    step_order: 1,
                    is_user_speaking: true
                },
                {
                    id: 2,
                    scenario_id: 1,
                    step_order: 2,
                    is_user_speaking: false
                }
            ]);

        if (stepsError) throw stepsError;
        console.log('Steps inserted successfully');

        // 5. Insert translations
        const { data: translations, error: transError } = await supabase
            .from('translations')
            .upsert([
                // English translations for step 1
                {
                    step_id: 1,
                    language_code: 'en',
                    text: 'Hello, how much does this cost?',
                    phonetic_text: 'Hello, how much does this cost?'
                },
                // Spanish translations for step 1
                {
                    step_id: 1,
                    language_code: 'es',
                    text: '¿Hola, cuánto cuesta esto?',
                    phonetic_text: 'Ola, kwanto kwesta esto?'
                },
                // Russian translations for step 1
                {
                    step_id: 1,
                    language_code: 'ru',
                    text: 'Здравствуйте, сколько это стоит?',
                    phonetic_text: 'Zdravstvuyte, skolko eto stoit?'
                },
                // Arabic translations for step 1
                {
                    step_id: 1,
                    language_code: 'ar',
                    text: 'مرحبا، كم يكلف هذا؟',
                    phonetic_text: 'Marhaban, kam yukalif hatha?'
                },
                // English translations for step 2 (vendor response)
                {
                    step_id: 2,
                    language_code: 'en',
                    text: 'This costs 20 dollars.',
                    phonetic_text: 'This costs 20 dollars.'
                },
                // Spanish translations for step 2
                {
                    step_id: 2,
                    language_code: 'es',
                    text: 'Esto cuesta 20 dólares.',
                    phonetic_text: 'Esto kwesta beynte dolares.'
                },
                // Russian translations for step 2
                {
                    step_id: 2,
                    language_code: 'ru',
                    text: 'Это стоит 20 долларов.',
                    phonetic_text: 'Eto stoit dvadtsat dollarov.'
                },
                // Arabic translations for step 2
                {
                    step_id: 2,
                    language_code: 'ar',
                    text: 'هذا يكلف عشرين دولارا.',
                    phonetic_text: 'Hatha yukalif ishreen dolaran.'
                }
            ]);

        if (transError) throw transError;
        console.log('Translations inserted successfully');

        console.log('Database setup completed successfully!');
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

setupDatabase(); 