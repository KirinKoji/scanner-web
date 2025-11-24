'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface UserData {
  name: string;
  company: string;
  position: string;
  imageUrl?: string;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const qrData = searchParams.get('data');
      
      if (!qrData) {
        setError('No QR code data found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user?qr=${encodeURIComponent(qrData)}`, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [searchParams]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print - ${userData?.name || 'Attendance'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .print-container {
              text-align: center;
              padding: 40px;
              border: 2px solid #000;
              max-width: 600px;
              width: 100%;
            }
            .user-image {
              width: 200px;
              height: 200px;
              border-radius: 50%;
              object-fit: cover;
              margin: 20px auto;
              border: 3px solid #000;
            }
            .user-name {
              font-size: 32px;
              font-weight: bold;
              margin: 20px 0;
              color: #000;
            }
            .company-name {
              font-size: 24px;
              margin: 10px 0;
              color: #333;
            }
            .position {
              font-size: 20px;
              margin: 10px 0;
              color: #666;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .print-container {
                border: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="mb-4 text-2xl font-semibold text-red-600">
            {error || 'User data not found'}
          </div>
          <button
            onClick={() => window.location.href = '/scanner'}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Scan Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-semibold text-black dark:text-zinc-50">
          Attendance Record
        </h1>

        <div
          ref={printRef}
          className="rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900"
        >
          <div className="print-container">
            {userData.imageUrl && (
              <img
                src={userData.imageUrl}
                alt={userData.name}
                className="user-image"
              />
            )}
            <div className="user-name">{userData.name}</div>
            <div className="company-name">{userData.company}</div>
            <div className="position">{userData.position}</div>
          </div>
        </div>

        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={handlePrint}
            className="rounded-lg bg-green-500 px-6 py-3 text-white transition-colors hover:bg-green-600"
          >
            Print
          </button>
          <button
            onClick={() => window.location.href = '/scanner'}
            className="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          >
            Scan Another
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
              Loading...
            </div>
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
// 'use client';

// import { useEffect, useState, useRef, Suspense } from 'react';
// import { useSearchParams } from 'next/navigation';

// interface UserData {
//   name: string;
//   company: string;
//   position: string;
//   imageUrl?: string;
// }

// function ResultContent() {
//   const searchParams = useSearchParams();
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');
//   const printRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       const qrData = searchParams.get('data');
      
//       if (!qrData) {
//         setError('No QR code data found');
//         setLoading(false);
//         return;
//       }

//       try {
//         const response = await fetch(`/api/user?qr=${encodeURIComponent(qrData)}`, {
//           method: 'GET',
//         });

//         if (!response.ok) {
//           const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
//           throw new Error(errorData.error || 'Failed to fetch user data');
//         }

//         const data = await response.json();
//         setUserData(data);
//       } catch (err) {
//         console.error('Error fetching user data:', err);
//         setError(err instanceof Error ? err.message : 'Failed to fetch user data');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, [searchParams]);

//   const handlePrint = () => {
//     if (!printRef.current) return;

//     const printWindow = window.open('', '_blank');
//     if (!printWindow) return;

//     const printContent = printRef.current.innerHTML;
//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Print - ${userData?.name || 'Attendance'}</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               display: flex;
//               justify-content: center;
//               align-items: center;
//               min-height: 100vh;
//               margin: 0;
//               padding: 20px;
//               background: white;
//             }
//             .print-container {
//               text-align: center;
//               padding: 40px;
//               border: 2px solid #000;
//               max-width: 600px;
//               width: 100%;
//             }
//             .user-image {
//               width: 200px;
//               height: 200px;
//               border-radius: 50%;
//               object-fit: cover;
//               margin: 20px auto;
//               border: 3px solid #000;
//             }
//             .user-name {
//               font-size: 32px;
//               font-weight: bold;
//               margin: 20px 0;
//               color: #000;
//             }
//             .company-name {
//               font-size: 24px;
//               margin: 10px 0;
//               color: #333;
//             }
//             .position {
//               font-size: 20px;
//               margin: 10px 0;
//               color: #666;
//             }
//             @media print {
//               body {
//                 margin: 0;
//                 padding: 0;
//               }
//               .print-container {
//                 border: none;
//                 padding: 0;
//               }
//             }
//           </style>
//         </head>
//         <body>
//           ${printContent}
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//     printWindow.focus();
//     setTimeout(() => {
//       printWindow.print();
//       printWindow.close();
//     }, 250);
//   };

//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
//         <div className="text-center">
//           <div className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
//             Loading...
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !userData) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
//         <div className="text-center">
//           <div className="mb-4 text-2xl font-semibold text-red-600">
//             {error || 'User data not found'}
//           </div>
//           <button
//             onClick={() => window.location.href = '/scanner'}
//             className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
//           >
//             Scan Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-black">
//       <div className="w-full max-w-2xl">
//         <h1 className="mb-6 text-center text-3xl font-semibold text-black dark:text-zinc-50">
//           Attendance Record
//         </h1>

//         <div
//           ref={printRef}
//           className="rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900"
//         >
//           <div className="print-container">
//             {userData.imageUrl && (
//               <img
//                 src={userData.imageUrl}
//                 alt={userData.name}
//                 className="user-image"
//               />
//             )}
//             <div className="user-name">{userData.name}</div>
//             <div className="company-name">{userData.company}</div>
//             <div className="position">{userData.position}</div>
//           </div>
//         </div>

//         <div className="mt-6 flex gap-4 justify-center">
//           <button
//             onClick={handlePrint}
//             className="rounded-lg bg-green-500 px-6 py-3 text-white transition-colors hover:bg-green-600"
//           >
//             Print
//           </button>
//           <button
//             onClick={() => window.location.href = '/scanner'}
//             className="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
//           >
//             Scan Another
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function ResultPage() {
//   return (
//     <Suspense
//       fallback={
//         <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
//           <div className="text-center">
//             <div className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
//               Loading...
//             </div>
//           </div>
//         </div>
//       }
//     >
//       <ResultContent />
//     </Suspense>
//   );
// }

