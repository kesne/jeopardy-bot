import { RTMClient, WebClient } from '@slack/client';
import Trebek from './trebek';
import { JeopardyImage, SlackResponse } from './types';
import CleverPersistence from './CleverPersistence';

const token = process.env.SLACK_TOKEN as string;

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
            return rtm.sendMessage(message, id);
        }
    },
    addReaction(id, reaction, ts) {
        return web.reactions.add({
            channel: id,
            timestamp: ts,
            name: reaction,
        });
    },
    async getDisplayName(id) {
        const response = await web.users.info({ user: id }) as SlackResponse;
        return response.user.profile.display_name;
    },
    persistence: new CleverPersistence(web, rtm),
});

rtm.on('connected', async () => {
    console.log(`JeopardyBot connected to Slack instance.`);
    await trebek.start();

    rtm.on('slack_event', (eventType, event) => {
        trebek.event(eventType, event);
    });

    rtm.on('message', message => {
        // Skip messages that have a subtype or are from us:
        if (message.subtype || message.user === rtm.activeUserId) {
            return;
        }

        trebek.input(message);
    });
});

rtm.start();
