'use client';

import { useEffect, useState, useRef } from 'react';

interface UserData {
  name: string;
  company: string;
  position: string;
  imageUrl?: string;
}

export default function DisplayPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState('');
  const [renderKey, setRenderKey] = useState(0);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRecordIdRef = useRef<string | null>(null);
  const lastRecordTimestampRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);
  const hasDisplayedRef = useRef(false);
  const displayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expiredRecordIdRef = useRef<string | null>(null);
  const initialRecordIdRef = useRef<string | null>(null);

  const fetchLatestAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance/latest?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        if (response.status === 404) return;
        console.error('API error:', response.status);
        return;
      }

      const data = await response.json();
      let record = data;

      if (data?.attendance) {
        record = data.attendance;
      } else if (Array.isArray(data?.data) && data.data.length > 0) {
        record = data.data[0];
      } else if (Array.isArray(data) && data.length > 0) {
        record = data[0];
      }

      if (!record || typeof record !== 'object') return;

      let imageUrl: string | undefined = undefined;
      
      if (Array.isArray(record.image) && record.image.length > 0) {
        imageUrl = record.image[0];
      } else if (typeof record.image === 'string' && record.image.trim()) {
        imageUrl = record.image;
      } else if (record.user?.imageUrl) {
        imageUrl = record.user.imageUrl;
      } else if (Array.isArray(record.user?.image) && record.user.image.length > 0) {
        imageUrl = record.user.image[0];
      } else if (typeof record.user?.image === 'string' && record.user.image.trim()) {
        imageUrl = record.user.image;
      } else if (record.imageUrl) {
        imageUrl = record.imageUrl;
      } else if (record.user?.photo) {
        imageUrl = record.user.photo;
      } else if (record.photo) {
        imageUrl = record.photo;
      }

      console.log('Image extraction:', {
        hasImage: !!imageUrl,
        imageUrl: imageUrl?.substring(0, 50),
        recordImage: record.image,
        recordImageUrl: record.imageUrl,
        userImage: record.user?.image,
        userImageUrl: record.user?.imageUrl
      });

      const name = record.firstName && record.lastName
        ? `${record.firstName} ${record.lastName}`
        : record.user?.name || record.name || 'Unknown';

      const company = record.user?.company || record.companyName || record.company || 'Unknown Company';
      const position = record.user?.position || record.position || record.user?.role || 'Unknown Position';

      const recordId = record.id || record._id || `${name}-${Date.now()}`;
      const timestamp = record.createdAt || record.created_at || record.updatedAt || record.updated_at;
      const timestampNum = timestamp ? new Date(timestamp).getTime() : Date.now();

      if (!initialRecordIdRef.current) {
        initialRecordIdRef.current = recordId;
        lastRecordIdRef.current = recordId;
        lastRecordTimestampRef.current = timestampNum;
        return;
      }

      if (expiredRecordIdRef.current === recordId) return;

      if (lastRecordIdRef.current !== recordId) {
        expiredRecordIdRef.current = null;
        
        if (displayTimerRef.current) {
          clearTimeout(displayTimerRef.current);
          displayTimerRef.current = null;
        }

        lastRecordIdRef.current = recordId;
        lastRecordTimestampRef.current = timestampNum;
        hasDisplayedRef.current = true;

        const newUserData: UserData = {
          name,
          company,
          position,
        };
        
        if (imageUrl && imageUrl.trim()) {
          newUserData.imageUrl = imageUrl;
        }

        setUserData(newUserData);
        setError('');
        setRenderKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  useEffect(() => {
    if (!userData) return;

    const timerId = setTimeout(() => {
      if (lastRecordIdRef.current) {
        expiredRecordIdRef.current = lastRecordIdRef.current;
      }
      setUserData(null);
    }, 20000);

    displayTimerRef.current = timerId;

    return () => {
      if (displayTimerRef.current) {
        clearTimeout(displayTimerRef.current);
      }
    };
  }, [userData]);

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    fetchLatestAttendance();
    
    pollIntervalRef.current = setInterval(() => {
      fetchLatestAttendance();
    }, 300);

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (displayTimerRef.current) {
        clearTimeout(displayTimerRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    if (displayTimerRef.current) {
      clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
    }
    setUserData(null);
    setError('');
    lastRecordIdRef.current = null;
    lastRecordTimestampRef.current = null;
    expiredRecordIdRef.current = null;
    initialRecordIdRef.current = null;
    hasDisplayedRef.current = false;
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 text-2xl font-semibold text-red-600">
            {error}
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <button
            onClick={() => {
              setUserData({
                name: 'Test User',
                company: 'Test Company',
                position: 'Test Position',
                imageUrl: undefined
              });
            }}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white text-sm mb-4"
          >
            Test Display
          </button>
          <p className="text-gray-500 text-sm">Waiting for QR scan...</p>
        </div>
      </div>
    );
  }

  return (
    <div key={`${userData.name}-${renderKey}`} className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8 dark:bg-gray-900">
      <div className="w-full max-w-4xl">
        <div className="rounded-lg bg-white p-16 shadow-2xl dark:bg-zinc-900">
          <div className="flex items-center gap-12">
            {userData.imageUrl ? (
              <div className="shrink-0">
                <img
                  key={userData.imageUrl}
                  src={userData.imageUrl}
                  alt={userData.name}
                  className="h-64 w-64 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600"
                  loading="eager"
                />
              </div>
            ) : null}
            <div className="flex-1">
              <h1 className="mb-4 text-7xl font-bold text-black dark:text-zinc-50">
                {userData.name}
              </h1>
              <h2 className="mb-3 text-4xl font-semibold text-zinc-700 dark:text-zinc-300">
                {userData.position}
              </h2>
              <p className="text-3xl text-zinc-600 dark:text-zinc-400">
                {userData.company}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={handleReset}
            className="rounded-lg bg-gray-500 px-8 py-3 text-lg text-white transition-colors hover:bg-gray-600"
          >
            Reset / Wait for Next Scan
          </button>
        </div>
      </div>
    </div>
  );
}

