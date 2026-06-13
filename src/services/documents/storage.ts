import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  userId: string
): Promise<{ key: string; url: string }> {
  const timestamp = Date.now();
  const key = `${userId}/${timestamp}_${filename}`;

  const { error } = await supabase.storage
    .from(config.supabaseBucket)
    .upload(key, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(config.supabaseBucket).getPublicUrl(key);

  return { key, url: publicUrl };
}

export async function deleteFile(key: string): Promise<void> {
  const { error } = await supabase.storage
    .from(config.supabaseBucket)
    .remove([key]);

  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

export async function getFileUrl(key: string): Promise<string> {
  const {
    data: { publicUrl },
  } = supabase.storage.from(config.supabaseBucket).getPublicUrl(key);
  return publicUrl;
}
