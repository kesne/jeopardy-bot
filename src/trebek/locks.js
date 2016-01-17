import lockFile from 'lockfile';
import winston from 'winston';

export function unlock(channelId) {
  return new Promise((resolve, reject) => {
    lockFile.unlock(`jeopardy-${channelId}.lock`, err => {
      if (err) {
        winston.error('Error unlocking file', err);
        return reject(err);
      }
      resolve();
    });
  });
}

export function lock(channelId) {
  return new Promise((resolve, reject) => {
    lockFile.lock(`jeopardy-${channelId}.lock`, {
      // Wait a maximum of 6 seconds:
      wait: 6 * 1000,
    }, err => {
      if (err) {
        winston.error('Error locking file', err);
        // If we can't get the channel lock, let's bust it (something's probably wrong).
        unlock(channelId);
        return reject(err);
      }
      resolve();
    });
  });
}
