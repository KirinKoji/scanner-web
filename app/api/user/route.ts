import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const qrData = request.nextUrl.searchParams.get('qr');

  if (!qrData) {
    return NextResponse.json({ error: 'QR code data is required' },
      { status: 400 });
  }

  try {
    const id = qrData.trim();
    const res = await fetch(`${BACKEND_URL}/attendance/${id}`);

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: res.status });
    }

    const data = await res.json();
    const user = data.user || {};

    return NextResponse.json({
      name: user.name || data.name || data.firstName + ' ' + data.lastName || 'Unknown',
      company: user.company || data.companyName || data.company || 'Unknown Company',
      position: user.position || data.position || user.role || 'Unknown Position',
      imageUrl: user.imageUrl || user.image || data.imageUrl || (Array.isArray(data.image) ? data.image[0] : data.image),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' },
      { status: 500 });
  }
}

