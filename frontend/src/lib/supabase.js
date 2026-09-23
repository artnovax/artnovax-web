import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabasePublishableKey =
    process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
        'Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_PUBLISHABLE_KEY'
    );
}

/*
 * Static-first public pages:
 *
 * pageContent.js already has complete built-in defaults. When the public page
 * CMS is disabled we short-circuit read-only requests to page_sections and
 * return an empty result, so those defaults render immediately without a
 * Supabase round trip.
 *
 * /admin is intentionally excluded so editors can continue reading/writing
 * page_sections in the CMS even while the public website is static-first.
 */
const publicPageCmsEnabled =
    process.env.REACT_APP_ENABLE_PAGE_CMS === 'true';

const staticFirstFetch = (input, init = {}) => {
    const requestUrl =
        typeof input === 'string'
            ? input
            : input?.url;

    const method =
        String(init?.method || input?.method || 'GET').toUpperCase();

    const isAdminRoute =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/admin');

    if (
        !publicPageCmsEnabled &&
        !isAdminRoute &&
        method === 'GET' &&
        requestUrl
    ) {
        try {
            const url = new URL(requestUrl);

            if (url.pathname.includes('/rest/v1/page_sections')) {
                return Promise.resolve(
                    new Response('[]', {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Range': '0-0/0',
                        },
                    })
                );
            }
        } catch {
            // If this is not a normal URL, let the real fetch handle it.
        }
    }

    return fetch(input, init);
};

export const supabase = createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
        global: {
            fetch: staticFirstFetch,
        },
    }
);
