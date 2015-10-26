import AWS from 'aws-sdk';
import moment from 'moment';
import {basename} from 'path';
import {createReadStream} from 'fs';
import {generateClue} from './generator';
import * as config from '../config';

// Configure AWS:
AWS.config.region = 'us-west-2';
AWS.config.update({
  accessKeyId: config.AWS_KEY,
  secretAccessKey: config.AWS_SECRET_KEY
});

const Bucket = 'jeopardybot';

const s3 = new AWS.S3();
s3.createBucket({
  Bucket,
  ACL: 'public-read'
});

function uploadToS3({filename, filepath}) {
  return new Promise(resolve => {
    s3.upload({
      Bucket,
      Key: filename,
      Body: createReadStream(filepath),
      // Images expire in 3 days to prevent too many files:
      Expires: moment().add(3, 'days').toDate()
    }, resolve);
  });
}

function getS3Url(filename) {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', {
      Bucket,
      Key: filename,
      Expires: moment.duration(3, 'days').asMilliseconds()
    }, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
}

export function s3Upload(filepath) {
  const filename = basename(filepath);
  return uploadToS3({
    filename,
    filepath
  }).then(() => {
    return getS3Url(filename);
  });
}

export async function captureAllClues(game) {
  game.questions.forEach(clue => {
    setTimeout(async () => {
      const filepath = await generateClue({
        game,
        clue
      });
      const filename = basename(filepath);
      return await uploadToS3({
        filename,
        filepath
      });
    }, 0);
  });
}

export function imageForClue({game, clue}) {
  return new Promise(resolve => {
    // TODO: Move the filename generator into a module:
    const filename = `${game.channel_id}.clue.${game.id}_${clue.id}.png`;
    s3.headObject({
      Bucket,
      Key: filename
    }, async (err, data) => {
      if (err || !data) {
        const filepath = await generateClue({
          game,
          clue
        });
        const url = await s3Upload(filepath);
        resolve(url);
      } else {
        const url = await getS3Url(filename);
        resolve(url);
      }
    });
  });
}
