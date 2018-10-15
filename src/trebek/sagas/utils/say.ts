import { getContext } from 'redux-saga/effects';
import { JeopardyImage } from '../../../types';

export default function* say(
    message: string,
    {
        image,
        ephemeral,
    }: {
        image?: JeopardyImage;
        ephemeral?: string;
    } = {},
) {
    const studio = yield getContext('studio');
    const manager = yield getContext('manager');

    yield manager.sendMessage({
        id: studio,
        message,
        image,
        ephemeral,
    });

    return;
}
