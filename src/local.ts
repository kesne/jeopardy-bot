import vorpal, { CommandInstance } from 'vorpal';
import trebek from './trebek';
import { INPUT, EVENT } from './trebek/actionTypes';

// @ts-ignore
const app = vorpal();

// Force Vorpal to exit when it is asked to:
process.on('SIGTERM', () => {
    process.exit(0);
});

app.catch('[input...]').action((args: any, callback: any) => {
    trebek.dispatch({
        type: INPUT,
        payload: {
            text: args.input.join(' '),
        },
        studio: {
            id: '123',
        },
        contestant: {
            id: '123',
        },
    });

    callback();
});

app.command('event <eventName>')
    .allowUnknownOptions()
    .action(function(this: CommandInstance, args: any, callback: any) {
        trebek.dispatch({
            type: EVENT,
            payload: {
                event: args.eventName,
            },
            studio: {
                id: '123',
            },
            contestant: {
                id: '123',
            },
        });
        callback();
        callback();
    });

app.delimiter('jeopardy$').show();
