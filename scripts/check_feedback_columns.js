
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkFeedbackTable() {
    try {
        const { data, error } = await supabase.from('feedback').select('*').limit(1);
        if (error) {
            console.log('Error accessing feedback table:', error.message);
        } else {
            console.log('Feedback table accessible. Sample data:', data);
        }
    } catch (err) {
        console.log('Exception:', err.message);
    }
}

checkFeedbackTable();
