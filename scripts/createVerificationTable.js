// Script to create verification_codes table via Supabase
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVerificationCodesTable() {
  try {
    console.log('Creating verification_codes table...');
    
    // Try to create the table directly
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .limit(0);

    if (error && error.message.includes('does not exist')) {
      console.log('Table does not exist, need to create it manually in Supabase SQL editor');
      console.log('Please run this SQL in your Supabase SQL editor:');
      console.log(`
CREATE TABLE verification_codes (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id)
);

CREATE INDEX idx_verification_codes_account_id ON verification_codes(account_id);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);
      `);
    } else if (error) {
      console.error('Error checking table:', error);
    } else {
      console.log('Verification codes table already exists!');
    }
  } catch (err) {
    console.error('Failed to check/create table:', err);
  }
}

createVerificationCodesTable();
