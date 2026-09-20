'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { compressImage, getImageUrl } from '@/lib/imageUtils';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/youtubeUtils';
import RichTextEditor from '@/components/ui/RichTextEditor';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Eye,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Link2,
  ArrowUpDown,
  Search,
  Sparkles,
  Save,
  X,
} from 'lucide-react';

interface GuideItem {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  youtubeUrl?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Form states (for Create or Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [coverMode, setCoverMode] = useState<'upload' | 'url'>('upload');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  // UI status
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch all guides
  const fetchGuides = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/guides');
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : res?.data?.data || [];
      setGuides(data);
    } catch (err: any) {
      console.error('Failed to load guides:', err);
      setFeedback({ type: 'error', message: 'Failed to load instruction guides from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  // Auto-generate slug from title if user hasn't explicitly customized slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
      setSlug(generated);
    }
  };

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const { base64Data, fileName } = await compressImage(file, 1280, 720, 0.82);
      const res: any = await api.post('/uploads', {
        base64Data,
        fileName,
        folder: 'guides',
      });
      const uploadedUrl = res.data?.url || res.url;
      if (uploadedUrl) {
        setCoverImageUrl(uploadedUrl);
        setFeedback({ type: 'success', message: 'Cover image uploaded successfully!' });
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setFeedback({ type: 'error', message: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCoverImageUrl('');
    setYoutubeUrl('');
    setDescription('');
    setSortOrder(0);
    setIsActive(true);
    setCoverMode('upload');
  };

  // Load guide for editing
  const startEdit = (guide: GuideItem) => {
    setEditingId(guide.id);
    setTitle(guide.title || '');
    setSlug(guide.slug || '');
    setCoverImageUrl(guide.coverImage || '');
    setYoutubeUrl(guide.youtubeUrl || '');
    setDescription(guide.description || '');
    setSortOrder(guide.sortOrder ?? 0);
    setIsActive(Boolean(guide.isActive));
    setCoverMode(guide.coverImage?.startsWith('http') ? 'url' : 'upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit form (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a title for the guide.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      coverImage: coverImageUrl.trim() || null,
      youtubeUrl: youtubeUrl.trim() || null,
      description: description.trim() || null,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };

    try {
      if (editingId) {
        await api.patch(`/admin/guides/${editingId}`, payload);
        setFeedback({ type: 'success', message: 'Instruction guide updated successfully!' });
      } else {
        await api.post('/admin/guides', payload);
        setFeedback({ type: 'success', message: 'New instruction guide published successfully!' });
      }
      resetForm();
      await fetchGuides();
    } catch (err: any) {
      console.error('Save guide error:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save guide. Please check inputs.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggle = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/admin/guides/${id}/toggle`);
      setGuides((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isActive: !g.isActive } : g))
      );
      setFeedback({ type: 'success', message: 'Status updated.' });
    } catch (err: any) {
      console.error('Toggle error:', err);
      setFeedback({ type: 'error', message: 'Failed to toggle status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete guide
  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.delete(`/admin/guides/${id}`);
      setGuides((prev) => prev.filter((g) => g.id !== id));
      setFeedback({ type: 'success', message: 'Guide deleted successfully.' });
      if (editingId === id) resetForm();
    } catch (err: any) {
      console.error('Delete error:', err);
      setFeedback({ type: 'error', message: 'Failed to delete guide.' });
    } finally {
      setActionLoadingId(null);
      setDeleteConfirmId(null);
    }
  };

  // Filtered guides
  const filteredGuides = guides.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.slug.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterActive === 'active') return matchesSearch && g.isActive;
    if (filterActive === 'inactive') return matchesSearch && !g.isActive;
    return matchesSearch;
  });

  const totalViews = guides.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);
  const videoGuidesCount = guides.filter((g) => Boolean(g.youtubeUrl)).length;
  const youtubeEmbedPreview = getYouTubeEmbedUrl(youtubeUrl);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Instruction Guides & Video Tutorials
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Create video tutorials, user instructions, and rich HTML guides for SafnexBD members.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/guides"
            target="_blank"
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Guides Page</span>
          </Link>

          <button
            onClick={fetchGuides}
            disabled={loading}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
            title="Refresh Guides"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Guides</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{guides.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active / Published</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {guides.filter((g) => g.isActive).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Video Tutorials</p>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{videoGuidesCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">Total Reader Views</p>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{totalViews}</p>
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 border text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Post / Edit Guide Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Instruction Guide' : 'Post New Guide / Video Tutorial'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editingId
                  ? 'Update the title, media, video or formatted HTML description.'
                  : 'Publish rich instructions, videos or guides for website users.'}
              </p>
            </div>
          </div>

          {editingId && (
            <button
              onClick={resetForm}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Row 1: Title & Slug */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Guide Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. How to buy digital products with Escrow protection"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                URL Slug <span className="text-slate-400 text-[11px] font-normal">(Auto-generated)</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="how-to-buy-with-escrow"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition font-mono text-xs"
              />
            </div>
          </div>

          {/* Row 2: Cover Image & YouTube Video */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cover Image */}
            <div className="space-y-2 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-500" />
                  <span>Cover Image (Upload or URL)</span>
                </label>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setCoverMode('upload')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                      coverMode === 'upload'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode('url')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                      coverMode === 'url'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Direct Link
                  </button>
                </div>
              </div>

              {coverMode === 'upload' ? (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-sky-500 bg-white dark:bg-slate-900 transition text-center group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-sky-500 transition mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {uploadingImage ? 'Compressing & uploading...' : 'Click to select image file'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG, WebP (auto-compressed for fast loading)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://example.com/cover-image.jpg"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* Cover Image Preview */}
              {coverImageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 mt-2 h-36 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(coverImageUrl)}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition"
                    title="Remove Cover Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* YouTube Video URL */}
            <div className="space-y-2 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-rose-500" />
                <span>YouTube Video Link (Optional)</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>

              {/* Live Embedded Player Preview */}
              {youtubeEmbedPreview ? (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-black shadow-inner">
                  <iframe
                    src={youtubeEmbedPreview}
                    title="YouTube Video Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="h-32 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-3 text-slate-400 dark:text-slate-500">
                  <Video className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-xs">Paste a YouTube link above to see the live video preview</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Rich HTML Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Instruction Guide Content / Description (HTML, H1, H2, Colors, Lists)
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Write the complete step-by-step tutorial or instructions here. Use H1, H2, custom text colors, bullet lists, bold text, or raw HTML mode..."
              minHeight="280px"
            />
          </div>

          {/* Row 4: Sort Order & Status & Submit Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-6">
              {/* Sort order */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sort Order:</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isActive ? 'Published (Active)' : 'Draft (Inactive)'}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : editingId ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Guide</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Publish Guide</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Guides List / Management Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              All Published Guides & Tutorials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage existing tutorials, change sort order, edit content, or toggle publication status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides..."
                className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterActive('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterActive === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All ({guides.length})
              </button>
              <button
                onClick={() => setFilterActive('active')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterActive === 'active'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterActive('inactive')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterActive === 'inactive'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
            <span className="text-xs font-medium">Loading guides...</span>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-10 h-10 opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {guides.length === 0 ? 'No instruction guides yet.' : 'No guides matched your search query.'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Use the form above to post your first video tutorial or instruction guide for users.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Media / Cover</th>
                  <th className="py-3.5 px-6">Guide Title & Slug</th>
                  <th className="py-3.5 px-4 text-center">Sort</th>
                  <th className="py-3.5 px-4 text-center">Views</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredGuides.map((guide) => {
                  const hasVideo = Boolean(guide.youtubeUrl);
                  const ytThumb = getYouTubeThumbnailUrl(guide.youtubeUrl);
                  const displayThumb = guide.coverImage
                    ? getImageUrl(guide.coverImage)
                    : ytThumb || '/images/placeholder.png';

                  return (
                    <tr
                      key={guide.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Thumbnail / Media Type */}
                      <td className="py-4 px-6">
                        <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={displayThumb}
                            alt={guide.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {hasVideo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="p-1 rounded-full bg-rose-600 text-white shadow-sm">
                                <Video className="w-3 h-3" />
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="py-4 px-6 max-w-md">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                            {guide.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              /guides/{guide.slug}
                            </span>
                            <Link
                              href={`/guides/${guide.slug}`}
                              target="_blank"
                              className="text-slate-400 hover:text-sky-500 transition"
                              title="Open public page"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          {hasVideo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                              <Video className="w-2.5 h-2.5" />
                              YouTube Video
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sort Order */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {guide.sortOrder}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 text-xs">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {guide.viewsCount || 0}
                        </span>
                      </td>

                      {/* Active / Inactive Switch */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          disabled={actionLoadingId === guide.id}
                          onClick={() => handleToggle(guide.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                            guide.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {guide.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(guide)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                            title="Edit Guide"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === guide.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={actionLoadingId === guide.id}
                                onClick={() => handleDelete(guide.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(guide.id)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition"
                              title="Delete Guide"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

