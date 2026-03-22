import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SUPABASE_URL = "https://qmwsxwucvlmunptuqlmi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtd3N4d3VjdmxtdW5wdHVxbG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDYyOTIsImV4cCI6MjA4OTM4MjI5Mn0.tsC01rXSrw2PYPieWMQkq_7B1cYxf3v3qlM0NUIXT4c";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    console.log("Starting password migration...");
    const { data: users, error } = await sb.from("users").select("*");
    
    if (error) { 
        console.error("Failed to fetch users:", error); 
        return; 
    }

    if (!users || users.length === 0) {
        console.log("No users found.");
        return;
    }

    let modified = 0;
    for (let u of users) {
        if (!u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) {
            console.log(`[MIGRATING] Hashing password for user: ${u.username}`);
            const hashed = bcrypt.hashSync(u.password, 10);
            const { error: updateError } = await sb.from("users").update({ password: hashed }).eq("id", u.id);
            if (updateError) {
                console.error(`[ERROR] Failed to update user ${u.username}:`, updateError);
            } else {
                modified++;
            }
        } else {
            console.log(`[SKIP] User: ${u.username} (already hashed)`);
        }
    }
    console.log(`Migration complete! Successfully hashed ${modified} plain-text passwords.`);
}

migrate();
