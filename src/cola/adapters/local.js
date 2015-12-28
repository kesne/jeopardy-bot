/**
 * ADAPTER CONFIGURATION
 */

export const CAPTURE_ALL_CLUES = true;

/**
 * ADAPTER API
 */

export async function setup() {

}

export async function board() {

}

export async function clue() {

}


function saveImage(filename, image) {
  return new Promise((resolve, reject) => {
    image.saveAsync(filename, err => {
      if (err) {
        return reject(err)
      }
      resolve(filename);
    });
  });
}


  return await saveImage(join(temporaryDirectory, `fullboard.${game.channel_id}.png`), board);
