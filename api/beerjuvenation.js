import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request) {
    try {
        const url = new URL(request.url);

        if (request.method === 'GET') {
            // Setup table implicitly if it wasn't run via seed.sql
            await sql`
                CREATE TABLE IF NOT EXISTS BEERJUVENATION (
                    YEAR INTEGER PRIMARY KEY,
                    DESCRIPTION TEXT,
                    MAIN_IMAGE_URL TEXT,
                    SECONDARY_IMAGE_URLS TEXT[]
                );
            `;
            await sql`ALTER TABLE BEERJUVENATION ADD COLUMN IF NOT EXISTS YEAR_NAME TEXT`;

            const { rows } = await sql`SELECT * FROM BEERJUVENATION ORDER BY YEAR DESC`;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const { year, year_name, description, main_image_url, secondary_image_urls } = body;

            if (!year) {
                return new Response(JSON.stringify({ error: 'Year is required' }), { status: 400 });
            }

            await sql`
                INSERT INTO BEERJUVENATION (YEAR, YEAR_NAME, DESCRIPTION, MAIN_IMAGE_URL, SECONDARY_IMAGE_URLS)
                VALUES (${year}, ${year_name || null}, ${description || null}, ${main_image_url || null}, ${secondary_image_urls || null})
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 201,
                headers: { 'content-type': 'application/json' }
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { year, year_name, description, main_image_url, secondary_image_urls } = body;

            if (!year) {
                return new Response(JSON.stringify({ error: 'Year is required' }), { status: 400 });
            }

            await sql`
                UPDATE BEERJUVENATION 
                SET 
                    YEAR_NAME = ${year_name || null},
                    DESCRIPTION = ${description || null},
                    MAIN_IMAGE_URL = ${main_image_url || null},
                    SECONDARY_IMAGE_URLS = ${secondary_image_urls || null}
                WHERE YEAR = ${year}
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }

        if (request.method === 'DELETE') {
            const year = url.searchParams.get('year');
            if (!year) return new Response('Missing Year', { status: 400 });
            await sql`DELETE FROM BEERJUVENATION WHERE YEAR = ${year}`;
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
