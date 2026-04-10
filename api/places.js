import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const url = new URL(request.url);
        
        if (request.method === 'GET') {
            const { rows } = await sql`SELECT * FROM PLACES ORDER BY PLACE_NAME ASC`;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }
        
        if (request.method === 'POST') {
            const body = await request.json();
            const { 
                ownership_id, chain_id, name, name_2, desc, arch_id, 
                addr, addr_2, city, state, zip, country, phone, 
                webpage, email, open_date, close_date, capacity 
            } = body;
            
            const result = await sql`
                INSERT INTO PLACES 
                (PLACE_OWNERSHIP_ID, CHAIN_ID, PLACE_NAME, PLACE_NAME_2, PLACE_DESC, ARCH_ID, 
                 PLACE_ADDR, PLACE_ADDR_2, PLACE_CITY, PLACE_STATE, PLACE_ZIP, PLACE_COUNTRY, 
                 PLACE_PHONE, PLACE_WEBPAGE, PLACE_EMAIL, PLACE_OPEN_DATE, PLACE_CLOSE_DATE, PLACE_CAPACITY)
                VALUES 
                (${ownership_id || 0}, ${chain_id || 0}, ${name}, ${name_2 || null}, ${desc || null}, ${arch_id || null},
                 ${addr || null}, ${addr_2 || null}, ${city || null}, ${state || null}, ${zip || null}, ${country || 'US'},
                 ${phone || null}, ${webpage || null}, ${email || null}, ${open_date || null}, ${close_date || null}, ${capacity || null})
                 RETURNING PLACE_ID
            `;
            
            const newId = result.rows[0].place_id;

            return new Response(JSON.stringify({ success: true, place_id: newId }), { 
                status: 201, 
                headers: { 'content-type': 'application/json' } 
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { 
                id, ownership_id, chain_id, name, name_2, desc, arch_id, 
                addr, addr_2, city, state, zip, country, phone, 
                webpage, email, open_date, close_date, capacity 
            } = body;
            
            await sql`
                UPDATE PLACES 
                SET 
                    PLACE_OWNERSHIP_ID = ${ownership_id || 0},
                    CHAIN_ID = ${chain_id || 0},
                    PLACE_NAME = ${name},
                    PLACE_NAME_2 = ${name_2 || null},
                    PLACE_DESC = ${desc || null},
                    ARCH_ID = ${arch_id || null},
                    PLACE_ADDR = ${addr || null},
                    PLACE_ADDR_2 = ${addr_2 || null},
                    PLACE_CITY = ${city || null},
                    PLACE_STATE = ${state || null},
                    PLACE_ZIP = ${zip || null},
                    PLACE_COUNTRY = ${country || 'US'},
                    PLACE_PHONE = ${phone || null},
                    PLACE_WEBPAGE = ${webpage || null},
                    PLACE_EMAIL = ${email || null},
                    PLACE_OPEN_DATE = ${open_date || null},
                    PLACE_CLOSE_DATE = ${close_date || null},
                    PLACE_CAPACITY = ${capacity || null}
                WHERE PLACE_ID = ${id}
            `;
            return new Response(JSON.stringify({ success: true }), { 
                status: 200, 
                headers: { 'content-type': 'application/json' } 
            });
        }

        if (request.method === 'DELETE') {
            const id = url.searchParams.get('id');
            if (!id) return new Response('Missing ID', { status: 400 });
            await sql`DELETE FROM PLACES WHERE PLACE_ID = ${id}`;
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
