import { sql } from '@vercel/postgres';

export const config = { runtime: 'nodejs' };

export default async function handler(request) {
    try {
        if (request.method === 'GET') {
            const { rows } = await sql`SELECT * FROM QUOTES ORDER BY QUOTE_ID ASC`;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'POST') {
            const { quote_desc, quote_author } = await request.json();
            const { rows } = await sql`
                INSERT INTO QUOTES (QUOTE_DESC, QUOTE_AUTHOR)
                VALUES (${quote_desc}, ${quote_author || null})
                RETURNING *
            `;
            return new Response(JSON.stringify(rows[0]), {
                status: 201,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'PUT') {
            const { id, quote_desc, quote_author } = await request.json();
            const { rows } = await sql`
                UPDATE QUOTES
                SET QUOTE_DESC = ${quote_desc}, QUOTE_AUTHOR = ${quote_author || null}
                WHERE QUOTE_ID = ${id}
                RETURNING *
            `;
            return new Response(JSON.stringify(rows[0]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers: { 'content-type': 'application/json' } });
            await sql`DELETE FROM QUOTES WHERE QUOTE_ID = ${id}`;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        return new Response('Method Not Allowed', { status: 405 });
    } catch (error) {
        console.error('Quotes API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
