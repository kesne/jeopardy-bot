import { uploadFile, setClientId } from 'imgur';

// Allow setting the imgur api:
if (process.env.IMGUR_API) {
  setClientId(process.env.IMGUR_API);
}

const MAX_RETRIES = 3;

export async function imgurUpload(file, attempt = 1) {
  // Allow 3 retires to upload images to imgur:
  if (attempt > MAX_RETRIES) {
    throw new Error('Error uploading image. Max number');
  }
  try {
    const { data } = await uploadFile(file);
    return data.link;
  } catch (e) {
    return imgurUpload(file, attempt + 1);
  }
}
