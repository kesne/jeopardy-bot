import {
    CREATE_STUDIO,
    TOGGLE_FEATURE,
    SET_ENABLED,
    SET_TIMEOUT,
} from '../actionTypes';
import { Studio } from '../../types';

export function createStudio(id: string, enabled: boolean) {
    return {
        type: CREATE_STUDIO,
        studio: id,
        payload: {
            enabled,
        },
    };
}

export function setEnabled(id: string, enabled: boolean) {
    return {
        type: SET_ENABLED,
        studio: id,
        payload: {
            enabled,
        },
    };
}

export function toggleFeature(
    id: string,
    name: keyof Studio['features'],
    enabled: boolean,
) {
    return {
        type: TOGGLE_FEATURE,
        studio: id,
        payload: {
            feature: name,
            enabled,
        },
    };
}

export function setTimeoutValue(
    id: string,
    name: keyof Studio['timeouts'],
    value: number,
) {
    return {
        type: SET_TIMEOUT,
        studio: id,
        payload: {
            timeout: name,
            value,
        },
    };
}
