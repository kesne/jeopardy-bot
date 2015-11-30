import AWS from 'aws-sdk';
import { basename } from 'path';
import { parallelLimit } from 'async';
import { createReadStream } from 'fs';
import { generateClue } from './generator';
import * as config from '../config';

const region = 'us-west-2';
const Bucket = 'jeopardybot';
const ACL = 'public-read';
const bucketUrl = `https://${Bucket}.s3-${region}.amazonaws.com`;

// Configure AWS:
AWS.config.region = region;
AWS.config.update({
  accessKeyId: config.AWS_KEY,
  secretAccessKey: config.AWS_SECRET_KEY,
});

const s3 = new AWS.S3();

function configureBucket() {
  s3.putBucketLifecycleConfiguration({
    Bucket,
    LifecycleConfiguration: {
      Rules: [
        {
          Prefix: 'jbot_',
          Status: 'Enabled',
          Expiration: {
            Days: 3,
          },
        },
      ],
    },
  });
}

s3.headBucket({
  Bucket,
}, err => {
  if (err) {
    s3.createBucket({
      ACL,
      Bucket,
    }, () => {
      configureBucket();
    });
  } else {
    configureBucket();
  }
});

function uploadToS3({ filename, filepath }) {
  return new Promise(resolve => {
    s3.upload({
      ACL,
      Bucket,
      Key: `jbot_${filename}`,
      Body: createReadStream(filepath),
    }, resolve);
  });
}

function getS3Url(filename) {
  return `${bucketUrl}/jbot_${filename}?ts=${Date.now()}`;
}

export function s3Upload(filepath) {
  const filename = basename(filepath);
  return uploadToS3({
    filename,
    filepath,
  }).then(() => {
    return getS3Url(filename);
  });
}

export async function captureAllClues(game) {
  setTimeout(() => {
    // Generate clues, 6 at a time:
    parallelLimit(game.questions.map(clue => {
      return async function uploadClueToS3(callback) {
        const filepath = await generateClue({
          game,
          clue,
        });
        const filename = basename(filepath);
        await uploadToS3({
          filename,
          filepath,
        });
        callback();
      };
    }), 6);
  }, 0);
}

export function imageForClue({ game, clue }) {
  return new Promise(resolve => {
    // TODO: Move the filename generator into a module:
    const filename = `${game.channel_id}.clue.${game.id}_${clue.id}.png`;
    s3.headObject({
      Bucket,
      Key: `jbot_${filename}`,
    }, async (err, data) => {
      if (err || !data) {
        const filepath = await generateClue({
          game,
          clue,
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
