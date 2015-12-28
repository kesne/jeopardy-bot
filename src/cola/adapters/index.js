import App from '../../models/App';
import * as imgurAdapter from './imgur';
import * as localAdapter from './local';
import * as s3Adapter from './s3';

export default async function getAdapter() {
  const app = await App.get();

  if (app.imageMode === 'imgur') {
    return imgurAdapter;
  } else if (app.imageMode === 'local') {
    return localAdapter;
  } else if (app.s3Adapter === 's3') {
    return s3Adapter;
  }

  throw new Error(`Adapter not found for image mode ${app.imageMode}.`);
}
