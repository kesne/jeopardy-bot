const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['en'] });

const categoryEntity = manager.addTrimEntity('clueCategory');
categoryEntity.addAfterLastCondition('en', 'category');
categoryEntity.addAfterLastCondition('en', 'cat');
categoryEntity.addBetweenCondition('en', 'take', 'for');
categoryEntity.addAfterLastCondition('en', 'take');

const valueEntity = manager.addRegexEntity('clueValue', ['en'], /\d{3,4}/gi);

manager.slotManager.addSlot('clue', 'clueCategory', false);
manager.slotManager.addSlot('clue', 'clueValue', false);

manager.addDocument('en', 'new game', 'new_game');
manager.addDocument('en', 'end game', 'end_game');
manager.addDocument('en', 'poke', 'poke');
manager.addDocument('en', 'uptime', 'uptime');
manager.addDocument('en', 'help', 'help');
manager.addDocument('en', 'ill take %clueCateogry% for %clueValue%', 'clue');
manager.addDocument('en', 'gimme', 'clue');
manager.addDocument('en', 'gimme category %clueCategory%', 'clue');
manager.addDocument('en', 'gimme cat %clueCategory%', 'clue');
manager.addDocument('en', 'gimme for %clueValue%', 'clue');
manager.addDocument('en', 'same', 'clue');

manager.train();
// manager.save();

(async () => {
    let result;
    try {
        result = await manager.process('en', 'ill take cat good stuff for $200');
        console.log(result.entities);
        result = await manager.process('en', 'end game');
        console.log(result);
        result = await manager.process('en', 'same');
        console.log(result);
    } catch(e) {
        console.log(e);
    }
})();
