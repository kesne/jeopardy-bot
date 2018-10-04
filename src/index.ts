import { RTMClient } from '@slack/client';
import Trebek from './trebek';

const token = process.env.SLACK_TOKEN || require('../token');

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
rtm.start();

const trebek = new Trebek();

trebek.say((message, id) => {
    rtm.sendMessage(message, id);
});

rtm.on('message', message => {
    // Skip messages that are from a bot or my own user ID
    if (
        (message.subtype && message.subtype === 'bot_message') ||
        (!message.subtype && message.user === rtm.activeUserId)
    ) {
        return;
    }

    trebek.input(message);
});

// // The RTM client can send simple string messages
// rtm.sendMessage('Hello there', conversationId)
//   .then((res) => {
//     // `res` contains information about the posted message
//     console.log('Message sent: ', res.ts);
//   })
//   .catch(console.error);
