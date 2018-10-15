import { SET_STUDIOS_ENABLED_BY_DEFAULT } from '../actionTypes';

export function setStudiosEnabledByDefault(enabled: boolean) {
    return {
        type: SET_STUDIOS_ENABLED_BY_DEFAULT,
        payload: {
            enabled,
        },
    };
}
