import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrData } = body;

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR code data is required' },
        { status: 400 }
      );
    }

    let qrDataParsed: any = null;
    let attendanceId: string | null = null;
    
    try {
      qrDataParsed = JSON.parse(qrData.trim());
      if (qrDataParsed.attendanceId) {
        attendanceId = qrDataParsed.attendanceId;
      } else if (qrDataParsed.id) {
        attendanceId = qrDataParsed.id;
      }
    } catch (e) {
      attendanceId = qrData.trim();
    }

    let existingRecord = qrDataParsed;
    
    if (attendanceId) {
      try {
        const fetchResponse = await fetch(`${BACKEND_URL}/attendance/${attendanceId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (fetchResponse.ok) {
          existingRecord = await fetchResponse.json();
        }
      } catch (fetchError: any) {
        // fallback to qrDataParsed
      }
    }

    const user = existingRecord.user || {};

    let imageArray: string[] = [];
    if (Array.isArray(existingRecord.image)) {
      imageArray = existingRecord.image;
    } else if (Array.isArray(user.image)) {
      imageArray = user.image;
    } else if (existingRecord.image) {
      imageArray = [existingRecord.image];
    } else if (user.imageUrl) {
      imageArray = [user.imageUrl];
    } else if (existingRecord.imageUrl) {
      imageArray = [existingRecord.imageUrl];
    } else if (user.image) {
      imageArray = [user.image];
    }
    
    const requestBody = {
      firstName: user.firstName || existingRecord.firstName || qrDataParsed?.firstName || user.name?.split(' ')[0] || 'Unknown',
      lastName: user.lastName || existingRecord.lastName || qrDataParsed?.lastName || user.name?.split(' ').slice(1).join(' ') || 'Unknown',
      age: user.age ?? existingRecord.age ?? qrDataParsed?.age ?? 18,
      phoneNumber: user.phoneNumber || existingRecord.phoneNumber || qrDataParsed?.phoneNumber || user.phone || existingRecord.phone || '+1234567890',
      image: imageArray,
      city: user.city || existingRecord.city || qrDataParsed?.city || 'Unknown',
      province: user.province || existingRecord.province || qrDataParsed?.province,
      companyName: user.companyName || existingRecord.companyName || qrDataParsed?.companyName || user.company || existingRecord.company || 'Unknown Company',
      position: user.position || existingRecord.position || qrDataParsed?.position || user.role || existingRecord.role || 'Unknown Position',
      date: existingRecord.date ? new Date(existingRecord.date) : new Date(),
      remark: attendanceId ? `Scanned from QR code - Original ID: ${attendanceId}` : 'Scanned from QR code',
    };

    const endpointsToTry = [
      `${BACKEND_URL}/attendance`,
      `${BACKEND_URL}/api/attendance`,
    ];
    
    let response;
    try {
      let backendUrl = endpointsToTry[0];

      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 404 && endpointsToTry.length > 1) {
        backendUrl = endpointsToTry[1];
        const apiResponse = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (apiResponse.status !== 404) {
          response = apiResponse;
        }
      }
    } catch (fetchError: any) {
      if (fetchError.code === 'ECONNREFUSED' || fetchError.cause?.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { 
            error: 'Cannot connect to backend server',
            details: `Backend URL: ${BACKEND_URL}`
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to connect to backend server',
          details: fetchError.message || 'Unknown error'
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      let errorText = '';
      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      
      if (contentType && contentType.includes('text/html')) {
        errorText = `Backend returned ${response.status} - Endpoint not found`;
      } else {
        let validationErrors = '';
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.message && Array.isArray(errorJson.message)) {
            validationErrors = '\n\nValidation errors:\n' + errorJson.message.join('\n');
          } else if (errorJson.message) {
            validationErrors = '\n\nError: ' + errorJson.message;
          }
        } catch (e) {
          // ignore parse errors
        }
        
        errorText = `Backend returned ${response.status} - Failed to create attendance record.${validationErrors}`;
      }
      
      return NextResponse.json(
        { error: 'Failed to record attendance', details: errorText },
        { status: response.status }
      );
    }

    const attendanceData = await response.json();
    return NextResponse.json(attendanceData, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record scan' },
      { status: 500 }
    );
  }
}
