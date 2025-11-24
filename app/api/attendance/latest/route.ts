import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://147.185.221.224:10246';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/attendance?page=1&limit=100&t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'No attendance records found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch latest attendance' }, { status: res.status });
    }

    const data = await res.json();
    let records = [];

    if (data.data && Array.isArray(data.data)) {
      records = data.data;
    } else if (Array.isArray(data)) {
      records = data;
    } else {
      records = [data];
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'No attendance records found' }, { status: 404 });
    }

    records.sort((a: any, b: any) => {
      const timeA = Math.max(
        new Date(a.createdAt || a.created_at || 0).getTime(),
        new Date(a.updatedAt || a.updated_at || 0).getTime()
      );
      const timeB = Math.max(
        new Date(b.createdAt || b.created_at || 0).getTime(),
        new Date(b.updatedAt || b.updated_at || 0).getTime()
      );
      return timeB - timeA;
    });

    return NextResponse.json(records[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch latest attendance' }, { status: 500 });
  }
}
