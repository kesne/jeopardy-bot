// TODO: Modified new S3 adapter that use s3fs to work on top of the standard local adapter.
// Will be a class that extends from the local adapter and overwrites methods with the s3fs interface.

import LocalAdapter from './local';

export default class S3Adapter extends LocalAdapter {
  startCleaning() {

  }
  stopCleaning() {

  }
}
