import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const url = new URL(request.url);

        if (request.method === 'GET') {
            await sql`ALTER TABLE FAMILY_MEMBERS ADD COLUMN IF NOT EXISTS FAMILY_EMAIL VARCHAR(100)`;
            await sql`ALTER TABLE FAMILY_MEMBERS ADD COLUMN IF NOT EXISTS FAMILY_PHONE VARCHAR(50)`;
            await sql`ALTER TABLE FAMILY_MEMBERS ADD COLUMN IF NOT EXISTS FAMILY_WEBSITE VARCHAR(255)`;
            
            await sql`SELECT setval(pg_get_serial_sequence('FAMILY_MEMBERS', 'family_member_id'), coalesce(max(family_member_id),0) + 1, false) FROM FAMILY_MEMBERS`;
            
            const { rows } = await sql`SELECT * FROM FAMILY_MEMBERS ORDER BY FAMILY_LAST_NAME ASC, FAMILY_FIRST_NAME ASC`;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const { first_name, middle_name, last_name, maiden_name, nickname, sex, birthday, deathday, desc, email, phone, website } = body;

            await sql`
                INSERT INTO FAMILY_MEMBERS 
                (FAMILY_FIRST_NAME, FAMILY_MIDDLE_NAME, FAMILY_LAST_NAME, FAMILY_MAIDEN_NAME, FAMILY_NICKNAME, FAMILY_SEX, FAMILY_BIRTHDAY, FAMILY_DEATHDAY, FAMILY_DESC, FAMILY_EMAIL, FAMILY_PHONE, FAMILY_WEBSITE)
                VALUES 
                (${first_name}, ${middle_name || null}, ${last_name || null}, ${maiden_name || null}, ${nickname || null}, ${sex}, ${birthday || null}, ${deathday || null}, ${desc || null}, ${email || null}, ${phone || null}, ${website || null})
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 201,
                headers: { 'content-type': 'application/json' }
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { id, first_name, middle_name, last_name, maiden_name, nickname, sex, birthday, deathday, desc, email, phone, website } = body;
            await sql`
                UPDATE FAMILY_MEMBERS 
                SET 
                    FAMILY_FIRST_NAME = ${first_name},
                    FAMILY_MIDDLE_NAME = ${middle_name || null},
                    FAMILY_LAST_NAME = ${last_name || null},
                    FAMILY_MAIDEN_NAME = ${maiden_name || null},
                    FAMILY_NICKNAME = ${nickname || null},
                    FAMILY_SEX = ${sex},
                    FAMILY_BIRTHDAY = ${birthday || null},
                    FAMILY_DEATHDAY = ${deathday || null},
                    FAMILY_DESC = ${desc || null},
                    FAMILY_EMAIL = ${email || null},
                    FAMILY_PHONE = ${phone || null},
                    FAMILY_WEBSITE = ${website || null}
                WHERE FAMILY_MEMBER_ID = ${id}
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }

        if (request.method === 'DELETE') {
            const id = url.searchParams.get('id');
            if (!id) return new Response('Missing ID', { status: 400 });
            await sql`DELETE FROM FAMILY_MEMBERS WHERE FAMILY_MEMBER_ID = ${id}`;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }

        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('Database Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
