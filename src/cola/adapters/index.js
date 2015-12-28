import App from '../../models/App';
import ImgurAdapter from './imgur';
// import * as LocalAdapter from './local';
// import * as S3Adapter from './s3';

let adapterInstance;

// Helper over getting a single instance, but allowing the instance to change over time:
function getAdapterInstance(Adapter) {
  if (adapterInstance instanceof Adapter) {
    return adapterInstance;
  }
  adapterInstance = new Adapter();
  return adapterInstance;
}

export default async function getAdapter() {
  const app = await App.get();

  if (app.imageMode === 'imgur') {
    return getAdapterInstance(ImgurAdapter);
  }
  // } else if (app.imageMode === 'local') {
  //   return localAdapter;
  // } else if (app.s3Adapter === 's3') {
  //   return s3Adapter;
  // }

  throw new Error(`Adapter not found for image mode ${app.imageMode}.`);
}
