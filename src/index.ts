import { RTMClient, WebClient } from '@slack/client';
import Trebek from './trebek';
import { JeopardyImage } from './types';

const token = process.env.SLACK_TOKEN || require('../token');

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
const web = new WebClient(token);

const trebek = new Trebek({
    sendMessage(id, message, image?: JeopardyImage) {
        if (image) {
            return web.files.upload({
                file: image.buffer,
                filename: image.filename,
                channels: id,
                initial_comment: message,
            });
        } else {
            rtm.sendMessage(message, id);
        }
    },
    async getDisplayName(id) {
        const response = await web.users.info({ user: id });
        // @ts-ignore This is because the slack client responses are not strongly typed:
        return response.user.profile.display_name;
    },
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
