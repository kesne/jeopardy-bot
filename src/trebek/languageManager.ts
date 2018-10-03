import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['en'] });

// Define our custom entities:
const categoryEntity = manager.addTrimEntity('clueCategory');
categoryEntity.addAfterLastCondition('en', 'category');
categoryEntity.addAfterLastCondition('en', 'cat');
categoryEntity.addBetweenCondition('en', 'take', 'for');
categoryEntity.addAfterLastCondition('en', 'take');

manager.addRegexEntity('clueValue', ['en'], /\d{3,4}/gi);

export default manager;
