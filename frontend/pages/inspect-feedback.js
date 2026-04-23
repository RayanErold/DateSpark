import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTable() {
    console.log('--- INSPECTING FEEDBACK DATA ---');
    
    const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('LATEST 5 FEEDBACK SUBMISSIONS:');
        console.table(data.map(r => ({
            id: r.id.substring(0, 8) + '...',
            email: r.email,
            text: r.text?.substring(0, 30),
            date: r.created_at
        })));
    }
}

inspectTable();
