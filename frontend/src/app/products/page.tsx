'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`/shop${qs ? `?${qs}` : ''}`);
  }, [router, searchParams]);

  return (
    <div className="p-12 text-center text-xs text-slate-400">
      Redirecting to Shop...
    </div>
  );
}

export default function ProductsRedirect() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Redirecting to Shop...</div>}>
      <RedirectContent />
    </Suspense>
  );
}
