import { WebAPICallResult } from '@slack/client';

// The slack API is not strongly typed, so we'll fake it here:
export interface SlackResponse extends WebAPICallResult {
    ts: string;
    channel: string;
    messages: {
        ts: string;
        files: {
            id: string;
            url_private: string;
        }[]
    }[];
    user: {
        profile: {
            display_name: string;
        }
    }
}

export interface SlackMessage {
    text: string;
    channel: string;
    user: string;
    ts: string;
}

export interface SlackEvent {
    channel?: string;
    user?: string;
}

export interface BaseAction {
    type: string;
    payload: {
        [key: string]: any;
    };
    contestant: string;
    studio: string;
}

export interface JeopardyImage {
    buffer: Buffer;
    filename: string;
}
