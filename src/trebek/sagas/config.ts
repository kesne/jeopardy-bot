import { input, say } from './utils';

export default function* config() {
    yield input('config', function*(action) {
        yield say('Configuring!');
    });
}
