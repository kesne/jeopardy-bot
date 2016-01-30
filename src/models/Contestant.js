import { Schema, model } from 'mongoose';

export const schema = new Schema({
  // Their slack ID:
  id: {
    type: String,
    required: true,
    index: true,
  },

  // Their actual name (for pretty printing):
  name: {
    type: String,
    required: true,
  },

  // Trebek can be insulting to sassy contestants:
  sassFactory: {
    type: Number,
    default: 0,
  },

  // The scores a user has in the active games.
  // Not stored in the game because we don't really care about it there.
  // At the end of the rounds, this is flushed into the stats `money`.
  scores: [{
    channel_id: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      default: 0,
    },
  }],

  // Simple stats:
  stats: {
    // Aggregate of all of the money won/lost from all games.
    money: {
      type: Number,
      default: 0,
    },
    // Number of games won:
    won: {
      type: Number,
      default: 0,
    },
    // Number of games lost:
    lost: {
      type: Number,
      default: 0,
    },
  },
});

schema.virtual('nonMentionedName').get(function () {
  return `${this.name.charAt(0)}.${this.name.substring(1)}`;
});

schema.statics.get = async function({ user_id: id, user_name: name }) {
  let user = await this.findOne({
    id,
  });
  if (!user) {
    user = await this.create({
      name,
      id,
    });
  } else if (user.name !== name) {
    // Update their slack username because it's changed.
    user.name = name;
    await user.save();
  }
  return user;
};

schema.methods.channelScore = function (channel_id) {
  const score = this.scores.find(s => {
    return s.channel_id === channel_id;
  });
  // If no score for this channel exists, create it:
  if (!score) {
    this.scores.push({
      channel_id,
      value: 0,
    });
    // Just re-run the score lookup:
    return this.channelScore(channel_id);
  }
  return score;
};

schema.methods.removeChannelScore = function (channel_id) {
  return this.scores.some((score, index) => {
    if (score.channel_id === channel_id) {
      // Remove the score:
      this.scores.splice(index, 1);
      return true;
    }
  });
};

schema.methods.correct = function ({ value, channel_id }) {
  const score = this.channelScore(channel_id);
  score.value += value;
  return this.save();
};

schema.methods.incorrect = function ({ value, channel_id }) {
  const score = this.channelScore(channel_id);
  score.value -= value;
  return this.save();
};

schema.methods.endGame = function ({ channel_id, won, lost }) {
  const { value } = this.channelScore(channel_id);
  this.stats.money += value;
  if (won) {
    this.stats.won++;
  }
  if (lost) {
    this.stats.lost++;
  }
  this.removeChannelScore(channel_id);
  return this.save();
};

export default model('Contestant', schema);
