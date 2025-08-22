// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ikatnzcebodgalveiceb.supabase.co'; // ← cámbialo
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYXRuemNlYm9kZ2FsdmVpY2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDE5OTIsImV4cCI6MjA2ODI3Nzk5Mn0.xQBvNpeAulTAKUEmXUYfrqtXgLv83g9gm2FWIdd_J-I';         // ← cámbialo

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
