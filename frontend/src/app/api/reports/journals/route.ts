import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    // Ambil param tanggal jika ada
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('karuna_journals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (startDate && endDate) {
      const startIso = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`;
      const endIso = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;
      query = query
        .or(`journal_date.gte.${startIso},and(journal_date.is.null,created_at.gte.${startIso})`)
        .or(`journal_date.lte.${endIso},and(journal_date.is.null,created_at.lte.${endIso})`);
    }

    const { data, error, count } = await query;
    if (error) {
      const { data: fallbackData, error: fbError, count: fbCount } = await supabase
        .from('karuna_journals')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fbError) return NextResponse.json({ error: fbError.message }, { status: 500 });
      return NextResponse.json({
        data: fallbackData || [],
        meta: { total: fbCount || 0, page, limit }
      });
    }

    return NextResponse.json({
      data: data || [],
      meta: { total: count || 0, page, limit }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
