import lockFile from 'lockfile';

export function lock(channel_id) {
  return new Promise((resolve, reject) => {
    lockFile.lock(`jeopardy-${channel_id}.lock`, {
      // Wait a maximum of 10 seconds:
      wait: 10 * 1000
    }, err => {
      if (err) {
        console.log('Error locking file', err);
        return reject(err);
      }
      resolve();
    });
  });
}

export function unlock(channel_id) {
  return new Promise((resolve, reject) => {
    lockFile.unlock(`jeopardy-${channel_id}.lock`, err => {
      if (err) {
        console.log('Error unlocking file', err);
        return reject(err);
      }
      resolve();
    });
  });
}
