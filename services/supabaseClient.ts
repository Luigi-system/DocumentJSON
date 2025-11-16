import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jhhlrndxepowacrndhni.supabase.co';
const supabaseAnonKey = 'sb_publishable_8ZMjgjtq3Es79c-E9s0dPA_54TqfCrc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
