import { getContext } from 'redux-saga/effects';
import { JeopardyImage } from '../../../types';

export default function* say(
    message: string,
    {
        image,
        ephemeral,
        attachments,
    }: {
        image?: JeopardyImage;
        ephemeral?: string;
        attachments?: any[];
    } = {},
) {
    const studio = yield getContext('studio');
    const manager = yield getContext('manager');

    yield manager.sendMessage({
        id: studio,
        message,
        image,
        ephemeral,
        attachments,
    });

    return;
}
