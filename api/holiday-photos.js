import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request) {
    try {
        const url = new URL(request.url);

        if (request.method === 'GET') {
            await sql`
                CREATE TABLE IF NOT EXISTS HOLIDAY_PHOTOS (
                    YEAR INTEGER PRIMARY KEY,
                    IMAGE_URL TEXT
                );
            `;

            const { rows } = await sql`SELECT * FROM HOLIDAY_PHOTOS ORDER BY YEAR DESC`;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const { year, image_url } = body;

            if (!year) return new Response(JSON.stringify({ error: 'Year is required' }), { status: 400 });

            await sql`
                INSERT INTO HOLIDAY_PHOTOS (YEAR, IMAGE_URL)
                VALUES (${year}, ${image_url || null})
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 201,
                headers: { 'content-type': 'application/json' }
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { year, image_url } = body;

            if (!year) return new Response(JSON.stringify({ error: 'Year is required' }), { status: 400 });

            await sql`
                UPDATE HOLIDAY_PHOTOS 
                SET IMAGE_URL = ${image_url || null}
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
            await sql`DELETE FROM HOLIDAY_PHOTOS WHERE YEAR = ${year}`;
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
