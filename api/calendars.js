import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request) {
    try {
        if (request.method === 'GET') {
            const { rows } = await sql`SELECT * FROM CALENDARS ORDER BY CALENDAR_DATE DESC`;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const {
                member, name, subname, date, dateEnd, event,
                placeId, categoryId, num, num2
            } = body;

            const { rows } = await sql`
                INSERT INTO CALENDARS (
                    CALENDAR_MEMBER, CALENDAR_NAME, CALENDAR_SUBNAME, 
                    CALENDAR_DATE, CALENDAR_DATE_END, CALENDAR_EVENT, 
                    PLACE_ID, CATEGORY_ID, CALENDAR_NUM, CALENDAR_NUM2
                ) VALUES (
                    ${member || 0}, ${name}, ${subname || null}, 
                    ${date}, ${dateEnd || null}, ${event}, 
                    ${placeId || null}, ${categoryId || null}, 
                    ${num || null}, ${num2 || null}
                ) RETURNING *;
            `;
            return new Response(JSON.stringify(rows[0]), {
                status: 201,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const {
                id, member, name, subname, date, dateEnd, event,
                placeId, categoryId, num, num2
            } = body;

            if (!id) return new Response('Missing ID', { status: 400 });

            const { rows } = await sql`
                UPDATE CALENDARS 
                SET 
                    CALENDAR_MEMBER = ${member},
                    CALENDAR_NAME = ${name},
                    CALENDAR_SUBNAME = ${subname || null},
                    CALENDAR_DATE = ${date},
                    CALENDAR_DATE_END = ${dateEnd || null},
                    CALENDAR_EVENT = ${event},
                    PLACE_ID = ${placeId || null},
                    CATEGORY_ID = ${categoryId || null},
                    CALENDAR_NUM = ${num || null},
                    CALENDAR_NUM2 = ${num2 || null}
                WHERE CALENDAR_ID = ${id}
                RETURNING *;
            `;
            return new Response(JSON.stringify(rows[0]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'DELETE') {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) return new Response('Missing ID', { status: 400 });

            await sql`DELETE FROM CALENDARS WHERE CALENDAR_ID = ${id}`;
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
