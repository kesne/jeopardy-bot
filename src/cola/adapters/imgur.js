import { generateBoard, generateClue } from '../generator';
import { uploadBase64, setClientId } from 'imgur';
import { IMGUR_API } from '../../config';

/**
 * HELPER FUNCTIONS:
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
    throw new Error('Error uploading image. Max number of retries hit.');
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
 * ADAPTER:
 */

export default class ImgurAdapter {
  // ADAPTER CONFIGURATION:
  CAPTURE_ALL_CLUES = false;

  constructor() {
    this.startImgurClient();
  }

  destroy() {}

  async startImgurClient() {
    if (IMGUR_API) {
      return await setClientId(IMGUR_API);
    }
  }

  async board(game) {
    const boardBuffer = await generateBoard(game);
    return await uploadImage(boardBuffer.toString('base64'));
  }

  async clue(game, clue) {
    const clueBuffer = await generateClue(game, clue);
    return await uploadImage(clueBuffer.toString('base64'));
  }
}
