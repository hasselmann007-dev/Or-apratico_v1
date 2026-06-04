import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elfwylltlsotqasdgpnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZnd5bGx0bHNvdHFhc2RncG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTQwOTksImV4cCI6MjA5NTEzMDA5OX0.PzNXZKAt0vAZwp0rVI_4ow-6i_zMGo2KueCpdyl8W74';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
