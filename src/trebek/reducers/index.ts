import { combineReducers } from 'redux';
import config from './config';
import games from './games';
import contestants from './contestants';
import studios from './studios';

export default combineReducers({
    config,
    games,
    contestants,
    studios,
});
