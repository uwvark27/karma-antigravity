import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        // Initialize table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS CELEBRATIONS (
              ID SERIAL PRIMARY KEY,
              NAME VARCHAR(100) NOT NULL,
              DESCRIPTION TEXT,
              IS_DYNAMIC BOOLEAN DEFAULT FALSE,
              FIXED_MONTH INTEGER,
              FIXED_DAY INTEGER,
              RRULE_STRING VARCHAR(255),
              ICON VARCHAR(10)
            )
        `;
        await sql`ALTER TABLE CELEBRATIONS ADD COLUMN IF NOT EXISTS ICON VARCHAR(10)`;

        if (request.method === 'GET') {
            const { rows } = await sql`SELECT * FROM CELEBRATIONS ORDER BY NAME ASC`;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const { name, description, is_dynamic, fixed_month, fixed_day, rrule_string, icon } = body;

            await sql`
                INSERT INTO CELEBRATIONS (NAME, DESCRIPTION, IS_DYNAMIC, FIXED_MONTH, FIXED_DAY, RRULE_STRING, ICON)
                VALUES (
                    ${name},
                    ${description || null},
                    ${is_dynamic || false},
                    ${is_dynamic ? null : (fixed_month || null)},
                    ${is_dynamic ? null : (fixed_day || null)},
                    ${is_dynamic ? (rrule_string || null) : null},
                    ${icon || null}
                )
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 201,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { id, name, description, is_dynamic, fixed_month, fixed_day, rrule_string, icon } = body;

            await sql`
                UPDATE CELEBRATIONS SET
                    NAME = ${name},
                    DESCRIPTION = ${description || null},
                    IS_DYNAMIC = ${is_dynamic || false},
                    FIXED_MONTH = ${is_dynamic ? null : (fixed_month || null)},
                    FIXED_DAY = ${is_dynamic ? null : (fixed_day || null)},
                    RRULE_STRING = ${is_dynamic ? (rrule_string || null) : null},
                    ICON = ${icon || null}
                WHERE ID = ${id}
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers: { 'content-type': 'application/json' } });

            await sql`DELETE FROM CELEBRATIONS WHERE ID = ${id}`;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('Celebrations API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
