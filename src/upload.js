import { uploadFile } from 'imgur';

const MAX_RETRIES = 3;

export async function upload(file, attempt=1) {
  // Allow 3 retires to upload images to imgur:
  if (attempt > MAX_RETRIES) {
    throw new Error('Error uploading image. Max number');
  }
  try {
    let {data} = await uploadFile('/home/kai/kittens.png');
    return data.link;
  } catch(e) {
    return upload(file, attempt + 1);
  }
};