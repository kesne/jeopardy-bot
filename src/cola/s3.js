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

function uniqueKey(filename) {
  const key = Math.round(Math.random() * 100000);
  return `${key}_${basename(filename)}`;
}

export function s3Upload(filename) {
  const uniqueFilename = uniqueKey(filename);
  return new Promise((resolve, reject) => {
    s3.upload({
      Bucket,
      Key: uniqueFilename,
      Body: createReadStream(filename),
      // Images expire in 3 days to prevent too many files:
      Expires: moment().add(3, 'days').toDate()
    }, (...args) => {
      console.log(args);
      s3.getSignedUrl('getObject', {
        Bucket,
        Key: uniqueFilename,
        Expires: moment.duration(3, 'days').asMilliseconds()
      }, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      });
    });
  });
}

export async function captureAllClues(game) {
  const localFiles = await Promise.all(
    game.questions.map(clue =>
      generateClue({
        game,
        clue
      })
    )
  );
  await Promise.all(
    localFiles.map(s3Upload)
  );
}

export function imageForClue() {
  
}
