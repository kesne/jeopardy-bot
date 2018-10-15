import { getContext } from 'redux-saga/effects';
import { selectStudio } from '../../selectors';
import { Studio } from '../../../types';

export default function* feature(name: keyof Studio['features']) {
    const studioId = yield getContext('studio');
    const studio: Studio = yield selectStudio(studioId);
    return studio.features[name];
}
