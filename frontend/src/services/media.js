import { supabase } from '@/lib/supabase';

export const MEDIA_BUCKET = 'site-media';
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const cleanText = (value) => {
  const text = String(value || '').trim();
  return text || null;
};

const randomId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const safeFileStem = (name = '') => {
  const withoutExtension = name.replace(/\.[^.]+$/, '');
  return withoutExtension
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
};

export function validateMediaFile(file) {
  if (!file || typeof file.name !== 'string') {
    throw new Error('Choose an image to upload.');
  }
  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    throw new Error('Use a JPG, PNG, WebP, GIF, or AVIF image.');
  }
  if (!file.size || file.size > MAX_MEDIA_BYTES) {
    throw new Error('Images must be smaller than 10 MB.');
  }
}

export function createMediaPath(file, now = new Date()) {
  validateMediaFile(file);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const extension = MIME_EXTENSIONS[file.type];
  return `${year}/${month}/${randomId()}-${safeFileStem(file.name)}.${extension}`;
}

export function getMediaPublicUrl(storagePath, bucketId = MEDIA_BUCKET) {
  if (!storagePath) return '';
  return supabase.storage.from(bucketId).getPublicUrl(storagePath).data.publicUrl;
}

const withPublicUrl = (asset) => asset ? {
  ...asset,
  public_url: getMediaPublicUrl(asset.storage_path, asset.bucket_id),
} : asset;

export async function listMediaAssets() {
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(withPublicUrl);
}

export async function uploadMediaAsset(file, metadata = {}) {
  validateMediaFile(file);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Sign in before uploading media.');

  const storagePath = createMediaPath(file);
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const payload = {
    bucket_id: MEDIA_BUCKET,
    storage_path: storagePath,
    original_filename: file.name,
    title: cleanText(metadata.title),
    alt_text: cleanText(metadata.altText),
    caption: cleanText(metadata.caption),
    mime_type: file.type,
    size_bytes: file.size,
    width: metadata.width || null,
    height: metadata.height || null,
    uploaded_by: userData.user.id,
  };

  const { data, error } = await supabase
    .from('media_assets')
    .insert(payload)
    .select()
    .single();

  if (error) {
    const { error: cleanupError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove([storagePath]);
    if (cleanupError) {
      throw new Error(
        `The image uploaded to ${storagePath}, but its library record and automatic cleanup failed: ${error.message}`
      );
    }
    throw error;
  }

  return withPublicUrl(data);
}

export async function updateMediaAsset(id, metadata = {}) {
  const { data, error } = await supabase
    .from('media_assets')
    .update({
      title: cleanText(metadata.title),
      alt_text: cleanText(metadata.altText),
      caption: cleanText(metadata.caption),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return withPublicUrl(data);
}

export async function deleteMediaAsset(id) {
  const { data: deleted, error: metadataError } = await supabase
    .from('media_assets')
    .delete()
    .eq('id', id)
    .select()
    .single();

  // Later content foreign keys can block this delete before the image is touched.
  if (metadataError) throw metadataError;

  const { error: storageError } = await supabase.storage
    .from(deleted.bucket_id)
    .remove([deleted.storage_path]);

  if (storageError) {
    const { error: restoreError } = await supabase
      .from('media_assets')
      .insert(deleted);

    if (restoreError) {
      throw new Error(
        `The stored image could not be deleted and its library record could not be restored: ${storageError.message}`
      );
    }
    throw storageError;
  }

  return withPublicUrl(deleted);
}
