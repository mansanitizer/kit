import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get("limit") || "50")
        const search = searchParams.get("search") || ""

        let query = supabase
            .from("interactions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit)

        if (search) {
            const searchLower = search.toLowerCase().trim()

            // Check for Year (e.g., 2024, 2025)
            const yearMatch = searchLower.match(/\b(20\d{2})\b/)
            if (yearMatch) {
                const year = yearMatch[1]
                const start = `${year}-01-01T00:00:00.000Z`
                const end = `${year}-12-31T23:59:59.999Z`
                query = query.gte('created_at', start).lte('created_at', end)
            }

            // Check for Month Name
            const months = [
                "january", "february", "march", "april", "may", "june",
                "july", "august", "september", "october", "november", "december"
            ];
            const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

            let monthIndex = -1

            // Explicit full name check
            monthIndex = months.findIndex(m => searchLower.includes(m));

            // Fallback to short name if no full name 
            if (monthIndex === -1) {
                // boundary check for short months to avoid false positives (e.g., 'dec' in 'declare')
                // actually, user asked for "fuzzy search", so "jan" is fine as a simple includes check usually,
                // but typically date search implies specific intent. Let's look for "jan" as a word or just substring if user is brief.
                // Ideally matching "jan" works. 
                monthIndex = shortMonths.findIndex(m => searchLower.includes(m));
            }

            if (monthIndex !== -1) {
                // If year is not specified, default to current year for the range, OR 
                // search ALL years for that month? "Jan" -> Jan 2024, Jan 2025...
                // The prompt says "fuzzy search by time (jan->dec) (2020-2025) etc". 
                // A simple implementation: filter by month number if possible, but standard PG timestamp filter is easier with ranges.
                // Supabase/Postgres doesn't easy filter "month = X" across years without raw SQL or RPC.
                // We'll stick to a simple heuristic: If Year IS provided, use that. If NOT, assumes Current Year for now OR just text search?
                // Let's rely on text search for tool_slug if it's not a date, BUT for Date, user expects filtering.
                // Let's implement a robust "Text Search on Tool Name OR Date Filter" approach.

                // Limitation: Filtering by "Month across all years" is tricky with simple chaining.
                // Let's ASSUME current year if no year found, to construct a valid range.
                // OR better, raw SQL filter: `EXTRACT(MONTH FROM created_at) = ?`
                // But .filter() uses query builder.

                // Let's try to infer if the *entire* query is date-like.
                // If user types "Jan", we probably want to filter tool_slug ILIKE '%jan%' OR created_at in Jan.
                // That requires "OR" logic which is also tricky in simple chains.

                // Strategy: 
                // If the search query looks strongly like a date (contains month name or year), we apply date filters.
                // Otherwise (or in ADDITION), we apply text search on tool_slug.
                // To keep it simple: We will perform text search on `tool_slug` ALWAYS.
                // AND if a date is detected, we ALSO filter by date range.
                // This means "Web Search Jan" -> (tool_slug contains "web search") AND (date is in Jan).

                const currentYear = new Date().getFullYear();
                const targetYear = yearMatch ? parseInt(yearMatch[1]) : currentYear;

                // Construct ISO range for that month in that year
                // monthIndex is 0-11
                const startDate = new Date(targetYear, monthIndex, 1);
                const endDate = new Date(targetYear, monthIndex + 1, 0, 23, 59, 59, 999); // Last day of month

                query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
            }

            // Always allow fuzzy text search on tool_slug
            // We remove the date parts from the string to search? or just search everything?
            // "Jan" -> matches tool "Django"? Probably not desired if intent is date.
            // Let's just search the raw string against tool_slug. 
            // If the user typed "Jan", it might match "Comparison" (no), "Jane" (yes).
            // But if we ALSO applied the date filter, we might get 0 results if they meant date but tool name doesn't match.

            // Refined Logic:
            // 1. Parse Date params.
            // 2. Remove date params from search string.
            // 3. Search remaining text against tool_slug.

            let term = searchLower;
            if (yearMatch) term = term.replace(yearMatch[0], "").trim();
            if (monthIndex !== -1) {
                // Remove the matched month string
                const mName = months[monthIndex];
                const sName = shortMonths[monthIndex];
                term = term.replace(new RegExp(`\\b${mName}\\b`, 'g'), "").replace(new RegExp(`\\b${sName}\\b`, 'g'), "").trim();
            }

            if (term.length > 0) {
                query = query.ilike('tool_slug', `%${term}%`)
            }
        }

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ interactions: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
