import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const url = new URL(request.url);
        if (request.method === 'GET') {
            await sql`SELECT setval(pg_get_serial_sequence('ARCHITECTURE', 'arch_id'), coalesce(max(arch_id),0) + 1, false) FROM ARCHITECTURE`;
            const { rows } = await sql`SELECT * FROM ARCHITECTURE ORDER BY ARCH_NAME ASC`;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }
        
        if (request.method === 'POST') {
            const body = await request.json();
            const { name, desc, building_type } = body;
            await sql`
                INSERT INTO ARCHITECTURE (ARCH_NAME, ARCH_DESC, BUILDING_TYPE_ID)
                VALUES (${name}, ${desc || null}, ${building_type || null})
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 201,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { id, name, desc, building_type } = body;
            await sql`
                UPDATE ARCHITECTURE
                SET ARCH_NAME = ${name},
                    ARCH_DESC = ${desc || null},
                    BUILDING_TYPE_ID = ${building_type || null}
                WHERE ARCH_ID = ${id}
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'DELETE') {
            const id = url.searchParams.get('id');
            await sql`DELETE FROM ARCHITECTURE WHERE ARCH_ID = ${id}`;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
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
