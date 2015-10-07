import fetch from 'node-fetch';
import { join } from 'path';
import { unlink } from 'fs';
import { uploadFile, setClientId } from 'imgur';
import * as config from './config';

// Allow setting the imgur api:
if (process.env.IMGUR_API) {
  setClientId(process.env.IMGUR_API);
}

const MAX_RETRIES = 3;

export async function getImageUrl({file, channel_id}) {
  await fetch(`http://localhost:${config.PORT}/image/${channel_id}/${file}`);

  const fileName = join(__dirname, '..', 'images', `${channel_id}.${file}.png`);

  let url = await upload(fileName);

  // After we've uploaded the image, we don't need it locally anymore.
  // Schedule it for next tick to prevent it from blocking the response.
  process.nextTick(() => {
    unlink(fileName, () => {});
  });
  return url;
};

async function upload(file, attempt=1) {
  // Allow 3 retires to upload images to imgur:
  if (attempt > MAX_RETRIES) {
    throw new Error('Error uploading image. Max number');
  }
  try {
    let {data} = await uploadFile(file);
    return data.link;
  } catch(e) {
    return upload(file, attempt + 1);
  }
};
