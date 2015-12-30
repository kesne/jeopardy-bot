// TODO: Modified new s3 adapter that use s3fs to work on top of the standard local adapter.
// Will be a class that extends from the local adapter and calls the super with the s3fs interface.
// LocalAdapter will store it on the instance, and default to standard fs.
import LocalAdapter from './local';
import s3fs from 's3fs';

export default class S3Adapter extends LocalAdapter {
  constructor() {
    super(s3fs);
  }

  startCleaning() {

  }
}
