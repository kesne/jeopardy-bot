import produce from 'immer';
import { BaseAction, ReduxState } from '../../types';
import { SET_STUDIOS_ENABLED_BY_DEFAULT } from '../actionTypes';

type State = ReduxState['config'];
const initialState: State = {
    studiosEnabledByDefault: true,
};

export default (state = initialState, action: BaseAction) =>
    produce(state, draft => {
        switch (action.type) {
            case SET_STUDIOS_ENABLED_BY_DEFAULT:
                draft.studiosEnabledByDefault = action.payload.enabled;
        }
    });
