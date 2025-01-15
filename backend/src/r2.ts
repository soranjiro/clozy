import { Env } from './index';
import { R2Bucket } from '@cloudflare/workers-types';

export const uploadImageToR2 = async (env: Env, userID: string, imageFile: File): Promise<string> => {
  const imageKey = `${userID}/${Date.now()}_${imageFile.name}`;
  const bucket = env.R2_BUCKET as R2Bucket;
  await bucket.put(imageKey, imageFile.stream());
  return imageKey;
};

export const getImageFromR2 = async (env: Env, imageKey: string): Promise<string | null> => {
  const bucket = env.R2_BUCKET as R2Bucket;
  const image = await bucket.get(imageKey);

  if (!image) {
    return null;
  }

  const imageArrayBuffer = await image.arrayBuffer();
  const base64Image = Buffer.from(imageArrayBuffer).toString('base64');
  return base64Image;
};

export const deleteImagesFromR2 = async (env: Env, imageKey: string): Promise<void> => {
  const bucket = env.R2_BUCKET as R2Bucket;
  const list = await bucket.list({ prefix: `${imageKey}/` });
  for (const object of list.objects) {
    await bucket.delete(object.key);
  }
};
