import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    try {
        const first_name = "Test";
        const middle_name = null;
        const last_name = "User";
        const maiden_name = null;
        const nickname = null;
        const sex = "M";
        const birthday = null;
        const deathday = null;
        const desc = null;
        const email = null;
        const phone = null;
        const website = null;
        
        await sql`
            INSERT INTO FAMILY_MEMBERS 
            (FAMILY_FIRST_NAME, FAMILY_MIDDLE_NAME, FAMILY_LAST_NAME, FAMILY_MAIDEN_NAME, FAMILY_NICKNAME, FAMILY_SEX, FAMILY_BIRTHDAY, FAMILY_DEATHDAY, FAMILY_DESC, FAMILY_EMAIL, FAMILY_PHONE, FAMILY_WEBSITE)
            VALUES 
            (${first_name}, ${middle_name}, ${last_name}, ${maiden_name}, ${nickname}, ${sex}, ${birthday}, ${deathday}, ${desc}, ${email}, ${phone}, ${website})
        `;
        console.log("Insert success!");
    } catch(err) {
        console.error("Insert failed:", err);
    }
}
run();
