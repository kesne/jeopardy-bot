import {Schema} from 'mongoose';

export const schema = new Schema({
  categories: [{
    id: {
      type: Number,
      required: true
    }
  }],
  
  questions: [{
    id: {
      type: Number,
      required: true
    }
  }]
});

export const Person = mongoose.model('Person', schema);
