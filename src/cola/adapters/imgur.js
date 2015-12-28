import { generateBoard, generateClue } from '../generator';
import { uploadBase64, setClientId } from 'imgur';
import { IMGUR_API } from '../../config';

/**
 * ADAPTER CONFIGURATION
 */

export const CAPTURE_ALL_CLUES = false;

/**
 * HELPER FUNCTIONS
 */

function promiseTimeout(timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

const MAX_RETRIES = 3;
const PROMISE_TIMEOUT = 200;
async function uploadImage(base64Image, attempt = 1) {
  // Allow 3 retires to upload images to imgur:
  if (attempt > MAX_RETRIES) {
    throw new Error('Error uploading image. Max number');
  }
  try {
    const { data: { link } } = await uploadBase64(base64Image);
    return link;
  } catch (e) {
    await promiseTimeout(PROMISE_TIMEOUT);
    return uploadImage(base64Image, attempt + 1);
  }
}

/**
 * ADAPTER API
 */

export async function setup() {
  if (IMGUR_API) {
    return await setClientId(IMGUR_API);
  }
}

export async function board() {
  const boardBuffer = generateBoard();
  return await uploadImage(boardBuffer.toString('base64'));
}

export async function clue() {
  const clueBuffer = generateClue();
  return await uploadImage(clueBuffer.toString('base64'));
}
