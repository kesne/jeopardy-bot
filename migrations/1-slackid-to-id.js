module.exports.id = 'slackid-to-id';

module.exports.up = function migrateUp(done) {
  const contestants = this.db.collection('contestants');
  contestants.updateMany({}, { $rename: { slackid: 'id' } }, function updateManyComplete(err) {
    done(err);
  });
};

module.exports.down = function migrateDown(done) {
  const contestants = this.db.collection('contestants');
  contestants.updateMany({}, { $rename: { id: 'slackid' } }, function updateManyComplete(err) {
    done(err);
  });
};
