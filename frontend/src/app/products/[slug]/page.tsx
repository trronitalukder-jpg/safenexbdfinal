'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  MessageSquare,
  Coins,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
  Share2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Camera,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import DOMPurify from 'dompurify';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { lang, t } = useLanguage();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Bid Modal state
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [targetPosition, setTargetPosition] = useState(1);
  const [bidAmount, setBidAmount] = useState<number>(10);
  const [bidCalc, setBidCalc] = useState<any>(null);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  const imagesList = product?.images && product.images.length > 0
    ? product.images
    : [{ id: 'fallback', imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80', isMain: true }];

  const currentIdx = Math.max(0, imagesList.findIndex((img: any) => img.imageUrl === (selectedImage || imagesList[0]?.imageUrl)));

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imagesList.length <= 1) return;
    const prevIdx = (currentIdx - 1 + imagesList.length) % imagesList.length;
    setSelectedImage(imagesList[prevIdx].imageUrl);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imagesList.length <= 1) return;
    const nextIdx = (currentIdx + 1) % imagesList.length;
    setSelectedImage(imagesList[nextIdx].imageUrl);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/products/${slug}`)
      .then((res: any) => {
        setProduct(res);
        if (res.images && res.images.length > 0) {
          const main = res.images.find((img: any) => img.isMain) || res.images[0];
          setSelectedImage(main.imageUrl);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // When bid modal opens, fetch calculation
  useEffect(() => {
    if (bidModalOpen && product) {
      api.get(`/bids/calculate?categoryId=${product.categoryId}&targetPosition=${targetPosition}`)
        .then((calc: any) => {
          setBidCalc(calc);
          setBidAmount(Number(calc.minimumRequiredBid));
        })
        .catch(() => {});
    }
  }, [bidModalOpen, targetPosition, product]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');

    try {
      await api.post('/bids', {
        productId: product.id,
        targetPosition,
        bidAmount: Number(bidAmount),
      });
      setBidSuccess(lang === 'bn' ? 'সফলভাবে বিড সাবমিট হয়েছে!' : 'Bid placed successfully!');
      setTimeout(() => setBidModalOpen(false), 2000);
    } catch (err: any) {
      setBidError(err.message || 'Failed to place bid');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {lang === 'bn' ? 'প্রোডাক্টটি খুঁজে পাওয়া যায়নি' : 'Product Not Found'}
        </h2>
        <Link href="/products" className="text-xs font-semibold text-sky-600 hover:underline">
          {lang === 'bn' ? 'সকল প্রোডাক্টে ফিরুন' : 'Back to Products'}
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === product.sellerId;

  return (
    <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600">{t('home')}</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-slate-600">{t('products')}</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 truncate max-w-xs">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Interactive Image Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative group aspect-square bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm flex items-center justify-center select-none">
            <img
              src={getImageUrl(selectedImage || imagesList[0]?.imageUrl)}
              alt={product.title}
              onClick={() => setLightboxOpen(true)}
              className="w-full h-full object-cover cursor-zoom-in transition duration-300 group-hover:scale-[1.02]"
            />

            {/* Carousel Prev & Next Buttons */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/60 hover:bg-sky-600 text-white backdrop-blur transition shadow-lg opacity-90 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                  title="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/60 hover:bg-sky-600 text-white backdrop-blur transition shadow-lg opacity-90 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                  title="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Photo Counter Badge */}
            {imagesList.length > 1 && (
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-slate-950/75 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md pointer-events-none z-10">
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {currentIdx + 1} / {imagesList.length}
                </span>
              </div>
            )}

            {/* Fullscreen Zoom Trigger Button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 text-white backdrop-blur transition shadow-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 z-10"
              title="Fullscreen Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails */}
          {imagesList.length > 1 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                <span>
                  {lang === 'bn' ? `ছবি সমূহ (${imagesList.length}টি)` : `Photos (${imagesList.length})`}
                </span>
                <span className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'ক্লিক করে ছবি পরিবর্তন করুন' : 'Click to change photo'}
                </span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
                {imagesList.map((img: any, idx: number) => {
                  const isActive = (selectedImage || imagesList[0]?.imageUrl) === img.imageUrl;
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setSelectedImage(img.imageUrl)}
                      className={`relative w-18 h-18 rounded-2xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                        isActive
                          ? 'border-sky-500 ring-2 ring-sky-500/30 scale-105 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-400'
                      }`}
                    >
                      <img src={getImageUrl(img.imageUrl)} alt="" className="w-full h-full object-cover" />
                      {img.isMain && (
                        <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-sky-600/90 text-white text-[8px] font-bold">
                          Cover
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Details & Actions (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                {product.productType === 'DIGITAL_DOWNLOAD' ? 'DIGITAL PRODUCT' : 'PHYSICAL PRODUCT'}
              </span>
              <span className="text-xs text-slate-400">
                {product.category?.name}
              </span>
            </div>

            {/* Spec #20: Title rendered as H1 */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {product.title}
            </h1>

            <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
              ৳ {Number(product.price).toLocaleString()}
            </div>
          </div>

          {/* Safe Escrow Assurance Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'bn' ? 'নিরাপদ লেনদেন এসক্রো নিশ্চয়তা' : 'SafnexBD Safe Escrow Guarantee'}</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
              {lang === 'bn'
                ? 'এই প্রোডাক্ট কেনার আগে সরাসরি চ্যাটে সেলারের সাথে কথা বলুন। পেমেন্টের পর টাকা সেলারের Hold ব্যালেন্সে থাকবে। কাজ বা ডেলিভারি পেয়ে কনফার্ম করলে তবেই সেলার টাকা তুলতে পারবে।'
                : 'Direct Chat with seller required before payment. Funds stay locked in Escrow Hold until you verify satisfaction.'}
            </p>
          </div>

          {/* Primary CTA: Chat with Seller (Spec #25) */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/dashboard/chat?targetUserId=${product.seller?.id}&productId=${product.id}`}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{lang === 'bn' ? 'সেলার সাথে চ্যাট শুরু করুন' : 'Chat with Seller'}</span>
            </Link>

            {isOwner && (
              <button
                onClick={() => setBidModalOpen(true)}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Coins className="w-4 h-4" />
                <span>{lang === 'bn' ? 'পজিশন প্রমোট (Bid)' : 'Promote via Bid'}</span>
              </button>
            )}
          </div>

          {/* Seller Card (Spec #10) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {lang === 'bn' ? 'সেলার পরিচিতি' : 'Seller Information'}
              </span>
              {product.seller?.isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VERIFIED SELLER</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {product.seller?.avatarUrl ? (
                <img
                  src={getImageUrl(product.seller.avatarUrl)}
                  alt={product.seller?.firstName || 'Seller'}
                  className="w-12 h-12 rounded-full object-cover border border-sky-500/30 flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-sky-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {product.seller?.firstName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {product.seller?.firstName} {product.seller?.lastName}
                </div>
                <div className="text-xs font-mono text-sky-600 font-semibold">
                  ID: {product.seller?.uniqueUserId}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn' ? 'সদস্য হয়েছেন: ' : 'Member since: '}
                {new Date(product.seller?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section (Spec #21: Professional rendered HTML) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          {lang === 'bn' ? 'প্রোডাক্ট বিবরণী' : 'Product Description'}
        </h2>
        <div
          className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: typeof window !== 'undefined' ? DOMPurify.sanitize(product.descriptionHtml || '') : (product.descriptionHtml || ''),
          }}
        />
      </div>

      {/* Smart Bid Position Promotion Modal (Spec #42-#46) */}
      {bidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>{lang === 'bn' ? 'স্মার্ট বিডিং — পজিশন বুস্ট' : 'Smart Bidding — Position Boost'}</span>
              </h3>
              <button
                onClick={() => setBidModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {bidError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-medium">
                {bidError}
              </div>
            )}

            {bidSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 text-xs font-medium">
                {bidSuccess}
              </div>
            )}

            <form onSubmit={handlePlaceBid} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  {lang === 'bn' ? 'টার্গেট পজিশন' : 'Target Position'}
                </label>
                <select
                  value={targetPosition}
                  onChange={(e) => setTargetPosition(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value={1}>Position #1 (Top First Spot)</option>
                  <option value={2}>Position #2 (Second Spot)</option>
                  <option value={3}>Position #3 (Third Spot)</option>
                </select>
              </div>

              {bidCalc && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Highest Bid:</span>
                    <span className="font-bold text-slate-900 dark:text-white">৳ {Number(bidCalc.currentHighestBid)}</span>
                  </div>
                  <div className="flex justify-between text-sky-600 dark:text-sky-400 font-semibold">
                    <span>Minimum Valid Bid:</span>
                    <span>৳ {Number(bidCalc.minimumRequiredBid)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  {lang === 'bn' ? 'আপনার বিড অ্যামাউন্ট (৳)' : 'Your Bid Amount (৳)'}
                </label>
                <input
                  type="number"
                  min={bidCalc ? Number(bidCalc.minimumRequiredBid) : 10}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(parseFloat(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'বিড অ্যামাউন্ট আপনার Available ব্যালেন্স থেকে রিজার্ভ হবে। অন্য কেউ বেশি বিড করলে টাকা স্বয়ংক্রিয়ভাবে ওয়ালেটে ফেরত আসবে।'
                    : 'Reserved from Available Balance. If outbid, funds are instantly released back to your wallet.'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBidModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  {lang === 'bn' ? 'বিড কনফার্ম করুন' : 'Confirm Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox / Zoom Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in select-none">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-20"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {imagesList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition z-20 shadow-lg"
                title="Previous photo"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition z-20 shadow-lg"
                title="Next photo"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center space-y-3">
            <img
              src={getImageUrl(selectedImage || imagesList[0]?.imageUrl)}
              alt={product.title}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            {imagesList.length > 1 && (
              <span className="text-white/80 text-xs font-mono font-bold">
                {currentIdx + 1} / {imagesList.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

