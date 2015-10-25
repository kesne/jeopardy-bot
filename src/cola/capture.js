import Pageres from 'pageres';
import Imagemin from 'imagemin';
import {join} from 'path';
import {tmpdir} from 'os';
import {stat} from 'fs';

import * as config from '../config';

const temporaryDirectory = tmpdir();

function fileExists(filename) {
  return new Promise((resolve, reject) => {
    stat(filename, (err, stats) => {
      if (err || !stats) {
        return reject(err);
      }
      resolve(filename);
    });
  });
}

export default function captureScreenshotToFile({id, channel_id, view, data, size = '1200x740'}) {
  const filename = `${channel_id}.${view}.${id}`;
  const filepath = join(temporaryDirectory, `${filename}.png`);

  return Promise.resolve().then(() => {
    // If we already have it on disk, we're done:
    return fileExists(filepath);
  }).catch(() => {
    return new Promise((resolve, reject) => {
      // Image not on disk, we need to capture it:
      const pageres = new Pageres()
        .src(
          `localhost:${config.PORT}/renderable/${view}?data=${encodeURIComponent(data)}`,
          [size],
          {crop: false, filename}
        )
        .dest(join(temporaryDirectory));

      console.time('Image Capture');
      pageres.run(err => {
        if (err) {
          return reject(err);
        }
        console.timeEnd('Image Capture');
        console.time('Image Minification');
        new Imagemin()
          .src(filepath)
          .dest(filepath)
          .use(Imagemin.optipng({optimizationLevel: 3}))
          .run(() => {
            console.timeEnd('Image Minification');
            resolve(filepath);
          });
      });
    });
  });
}
