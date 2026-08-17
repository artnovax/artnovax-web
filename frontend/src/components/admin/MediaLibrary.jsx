import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Image as ImageIcon,
  ImagePlus,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ALLOWED_MEDIA_TYPES,
  deleteMediaAsset,
  listMediaAssets,
  updateMediaAsset,
  uploadMediaAsset,
  validateMediaFile,
} from '@/services/media';

const inputCls =
  'w-full rounded-lg ring-1 ring-ivory-300 bg-ivory px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-burgundy/40';

const emptyMetadata = { title: '', altText: '', caption: '' };

const formatBytes = (bytes = 0) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readImageDimensions = (file) => new Promise((resolve) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new window.Image();
  image.onload = () => {
    resolve({ width: image.naturalWidth, height: image.naturalHeight });
    URL.revokeObjectURL(objectUrl);
  };
  image.onerror = () => {
    resolve({ width: null, height: null });
    URL.revokeObjectURL(objectUrl);
  };
  image.src = objectUrl;
});

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="text-[11.5px] uppercase tracking-widest text-ink/60 font-semibold">
      {label}
    </span>
    {hint && <span className="ml-2 text-[11.5px] text-ink/50 normal-case tracking-normal">{hint}</span>}
    <div className="mt-1">{children}</div>
  </label>
);

const MetadataFields = ({ value, onChange, altRequired = false }) => (
  <>
    <Field label="Title" hint="internal library label">
      <input
        value={value.title}
        onChange={(event) => onChange({ ...value, title: event.target.value })}
        className={inputCls}
        placeholder="Community art workshop"
      />
    </Field>
    <Field label="Alt text" hint="describe what is visible">
      <input
        required={altRequired}
        value={value.altText}
        onChange={(event) => onChange({ ...value, altText: event.target.value })}
        className={inputCls}
        placeholder="Participants painting together at a workshop"
      />
    </Field>
    <Field label="Caption" hint="optional public-facing context">
      <textarea
        rows={3}
        value={value.caption}
        onChange={(event) => onChange({ ...value, caption: event.target.value })}
        className={inputCls}
      />
    </Field>
  </>
);

const MediaLibrary = ({ onSelect, selectedId = null }) => {
  const fileInputRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(emptyMetadata);
  const [editing, setEditing] = useState(null);
  const [editMetadata, setEditMetadata] = useState(emptyMetadata);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setAssets(await listMediaAssets());
    } catch (loadError) {
      setError(loadError?.message || 'Could not load the media library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredAssets = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter((asset) => [
      asset.title,
      asset.original_filename,
      asset.alt_text,
      asset.caption,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [assets, query]);

  const resetUpload = () => {
    setFile(null);
    setMetadata(emptyMetadata);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setError('');
    if (!nextFile) {
      setFile(null);
      return;
    }
    try {
      validateMediaFile(nextFile);
      setFile(nextFile);
      if (!metadata.title) {
        setMetadata((current) => ({
          ...current,
          title: nextFile.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        }));
      }
    } catch (fileError) {
      event.target.value = '';
      setFile(null);
      setError(fileError.message);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      validateMediaFile(file);
      const dimensions = await readImageDimensions(file);
      const created = await uploadMediaAsset(file, { ...metadata, ...dimensions });
      setAssets((current) => [created, ...current]);
      resetUpload();
      setShowUpload(false);
    } catch (uploadError) {
      setError(uploadError?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (asset) => {
    setEditing(asset);
    setEditMetadata({
      title: asset.title || '',
      altText: asset.alt_text || '',
      caption: asset.caption || '',
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await updateMediaAsset(editing.id, editMetadata);
      setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset));
      setEditing(null);
    } catch (updateError) {
      setError(updateError?.message || 'Could not update the image details.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (asset) => {
    const label = asset.title || asset.original_filename;
    if (!window.confirm(`Permanently delete “${label}”?`)) return;

    setBusy(true);
    setError('');
    try {
      await deleteMediaAsset(asset.id);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
    } catch (deleteError) {
      setError(deleteError?.message || 'Could not delete the image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif-display text-burgundy text-[22px] font-semibold">
            Media Library
          </h3>
          <p className="mt-1 text-ink/60 text-[13px]">
            Upload authentic ArtNovaX images once, then reuse them across the website.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload((current) => !current)}
          className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light"
        >
          {showUpload ? <X className="w-4 h-4" /> : <ImagePlus className="w-4 h-4" />}
          {showUpload ? 'Close upload' : 'Upload image'}
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl bg-red-50 text-red-800 px-4 py-3 text-[13px]">
          {error}
        </div>
      )}

      {showUpload && (
        <form
          onSubmit={handleUpload}
          className="mt-4 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <Field label="Image file" hint="JPG, PNG, WebP, GIF, or AVIF · max 10 MB">
              <input
                ref={fileInputRef}
                required
                type="file"
                accept={ALLOWED_MEDIA_TYPES.join(',')}
                onChange={handleFileChange}
                className={`${inputCls} file:mr-3 file:rounded-full file:border-0 file:bg-burgundy/10 file:px-3 file:py-1 file:text-burgundy file:font-semibold`}
              />
            </Field>
          </div>
          <MetadataFields value={metadata} onChange={setMetadata} altRequired />
          <div className="flex items-end md:justify-end">
            <button
              disabled={busy || !file}
              className="cta-btn inline-flex items-center justify-center gap-2 rounded-full bg-burgundy text-ivory px-5 py-2.5 text-[13.5px] font-semibold hover:bg-burgundy-light disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {busy ? 'Uploading…' : 'Upload to library'}
            </button>
          </div>
        </form>
      )}

      {editing && (
        <form
          onSubmit={handleUpdate}
          className="mt-4 rounded-2xl bg-ivory-100 ring-1 ring-burgundy/30 p-5 grid grid-cols-1 md:grid-cols-[140px_1fr_1fr] gap-4"
        >
          <img
            src={editing.public_url}
            alt={editing.alt_text || ''}
            className="w-full h-32 rounded-xl object-cover bg-ivory-200"
          />
          <div className="space-y-3">
            <MetadataFields value={editMetadata} onChange={setEditMetadata} />
          </div>
          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-full ring-1 ring-ivory-300 px-4 py-2 text-[13px] font-semibold hover:bg-ivory-200"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              className="cta-btn inline-flex items-center gap-2 rounded-full bg-burgundy text-ivory px-4 py-2 text-[13px] font-semibold hover:bg-burgundy-light disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              Save details
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-[520px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/45" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search filename, title, alt text, or caption"
            className={`${inputCls} pl-10`}
          />
        </div>
        <span className="text-ink/55 text-[12.5px]">
          {filteredAssets.length} {filteredAssets.length === 1 ? 'image' : 'images'}
        </span>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 px-4 py-12 text-center text-ink/60 text-[13.5px]">
          Loading media…
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-ivory-100 ring-1 ring-ivory-300 px-4 py-12 text-center">
          <ImageIcon className="mx-auto w-8 h-8 text-burgundy/45" />
          <p className="mt-2 text-ink/60 text-[13.5px]">
            {query ? 'No images match this search.' : 'No media uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <article
              key={asset.id}
              className={`rounded-2xl bg-ivory-100 ring-1 overflow-hidden ${selectedId === asset.id ? 'ring-2 ring-burgundy' : 'ring-ivory-300'}`}
            >
              <div className="aspect-[4/3] bg-ivory-200 overflow-hidden">
                <img
                  src={asset.public_url}
                  alt={asset.alt_text || ''}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <div className="font-semibold text-ink text-[13.5px] truncate">
                  {asset.title || asset.original_filename}
                </div>
                <div className="mt-0.5 text-ink/50 text-[11.5px] truncate">
                  {asset.width && asset.height ? `${asset.width} × ${asset.height} · ` : ''}
                  {formatBytes(asset.size_bytes)}
                </div>
                <p className="mt-2 text-ink/65 text-[12px] line-clamp-2 min-h-[36px]">
                  {asset.alt_text || 'No alt text'}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  {onSelect && (
                    <button
                      type="button"
                      onClick={() => onSelect(asset)}
                      className="mr-auto rounded-full bg-burgundy text-ivory px-3 py-1.5 text-[12px] font-semibold hover:bg-burgundy-light"
                    >
                      Use image
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Edit ${asset.title || asset.original_filename}`}
                    onClick={() => startEdit(asset)}
                    className="w-8 h-8 rounded-full hover:bg-ivory-200 flex items-center justify-center text-burgundy"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${asset.title || asset.original_filename}`}
                    disabled={busy}
                    onClick={() => handleDelete(asset)}
                    className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export const MediaPicker = ({ value, onChange, buttonLabel = 'Choose from media library' }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {value?.public_url && (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-ivory-100 ring-1 ring-ivory-300 p-2">
          <img
            src={value.public_url}
            alt={value.alt_text || ''}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <div className="font-semibold text-[13px] truncate">{value.title || value.original_filename}</div>
            <div className="text-ink/55 text-[11.5px] truncate">{value.alt_text}</div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full ring-1 ring-burgundy/30 text-burgundy px-4 py-2 text-[13px] font-semibold hover:bg-burgundy/10"
      >
        <ImageIcon className="w-4 h-4" />
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-ink/55 p-4 md:p-8 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Choose an image">
          <div className="mx-auto max-w-[1200px] rounded-3xl bg-ivory p-5 md:p-7 shadow-2xl">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                aria-label="Close media picker"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-ivory-200 flex items-center justify-center text-ink/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <MediaLibrary
              selectedId={value?.id}
              onSelect={(asset) => {
                onChange(asset);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
