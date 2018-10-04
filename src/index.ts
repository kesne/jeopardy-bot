import { RTMClient } from '@slack/client';
import Trebek from './trebek';

const token = process.env.SLACK_TOKEN || require('../token');

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
const trebek = new Trebek((id, message) => {
    rtm.sendMessage(message, id);
});

rtm.on('connected', () => {
    console.log(`JeopardyBot connected to Slack instance.`);
});

rtm.on('slack_event', (eventType, event) => {
    trebek.event(eventType, event);
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

rtm.start();
