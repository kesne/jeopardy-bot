import { input, say } from './utils';

export default function* poke() {
    yield input('poke', function*() {
        yield say("I'm here, I'm here...");
    });
}
