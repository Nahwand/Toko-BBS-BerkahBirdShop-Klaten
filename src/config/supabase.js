import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qmwsxwucvlmunptuqlmi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtd3N4d3VjdmxtdW5wdHVxbG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDYyOTIsImV4cCI6MjA4OTM4MjI5Mn0.tsC01rXSrw2PYPieWMQkq_7B1cYxf3v3qlM0NUIXT4c";
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
