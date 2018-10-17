import { WebClient, RTMClient } from '@slack/client';
import axios from 'axios';
import { SlackResponse } from './types';

// This is a persistence layer that's built on top of slack itself. It persists
// and revives data via an uploaded file in a DM to itself. This is ideal
// because it will work for all users out of the box.
// In the future, we might want to have this create a DM with the bot owner,
// or possibly give the option to create a channel to put the configuration in,
// so that you can modify the state manually, or copy the state between slack
// instances.
// Also, this is not the most ideal implementation. More ideally we'd do
// something like a journal, and flush messages more frequently, and compact at
// some frequenecy. If we did that, we'd need to do it as messages rather than
// files, because files are heavily rate limited.

export default class CleverPersistence {
    private channelForSelf?: string;
    constructor(private web: WebClient, private rtm: RTMClient) {}

    private async getChannelForConfig(): Promise<string> {
        if (this.channelForSelf) return this.channelForSelf;

        const { channel, ts } = (await this.web.chat.postMessage({
            as_user: true,
            text: 'marker',
            channel: this.rtm.activeUserId!,
        })) as SlackResponse;

        this.channelForSelf = channel;

        // Delete the marker message:
        await this.web.chat.delete({
            channel,
            ts,
        });

        return channel;
    }

    async persist(blob: string) {
        const channel = await this.getChannelForConfig();

        await this.web.files.upload({
            file: Buffer.from(blob),
            filetype: 'binary',
            filename: 'Jeopardy Configuration',
            channels: channel,
        });

        // Delete any old messages:

        const history = (await this.web.conversations.history({
            channel,
            limit: 5,
        })) as SlackResponse;

        await Promise.all(
            history.messages
                // Make sure we don't delete the file we literally just uploaded:
                .filter((_, index) => index !== history.messages.length - 2)
                .map(message =>
                    // @ts-ignore
                    Promise.all([
                        this.web.chat.delete({ channel, ts: message.ts }),
                        message.files
                            ? this.web.files.delete({
                                  file: message.files[0].id,
                              })
                            : Promise.resolve(),
                    ]),
                ),
        );
    }

    async revive(): Promise<string> {
        const channel = await this.getChannelForConfig();
        const history = (await this.web.conversations.history({
            channel,
            limit: 2,
        })) as SlackResponse;

        const [configurationMessage] = history.messages;

        if (!configurationMessage || !configurationMessage.files) {
            throw new Error('No revive configuration found');
        }

        const { data } = await axios.get(
            configurationMessage.files[0].url_private,
            {
                // Don't attempt to parse the response as JSON.
                // We want the persistence layer to always operate on strings
                // so that we can swap the underlying data representation.
                transformResponse: (req) => req,
                responseType: 'text',
                headers: {
                    Authorization: `Bearer ${this.web.token}`,
                },
            },
        );

        return data;
    }
}
