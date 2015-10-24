import AWS from 'aws-sdk';
import moment from 'moment';

AWS.config.region = 'us-west-2';

const s3 = new AWS.S3();

function getBucketNameForId(id) {
  return `jeopardy_game_${id}`;
}

export function setupBucketForGame({game}) {
  return new Promise(resolve => {
    s3.createBucket({
      Bucket: getBucketNameForId(game.id),
      ACL: 'public-read'
    }, () => resolve);
  });
}

export function uploadImage({game, image}) {
  s3.upload({
    Bucket: getBucketNameForId(game.id),
    Key: 'TODO',
    Body: image,
    // Images expire in 24 hours to prevent
    Expires: moment().add(1, 'day').toDate()
  });
}
