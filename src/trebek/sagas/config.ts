import { put } from 'redux-saga/effects';
import { input, say } from './utils';
import { selectConfig, selectStudio } from '../selectors';
import { Studio } from '../../types';
import { setStudiosEnabledByDefault } from '../actions/config';
import { toggleFeature, setEnabled, setTimeoutValue } from '../actions/studios';

function yesOrNo(bool: boolean) {
    return {
        value: bool ? 'Yes' : 'No',
        short: bool,
    };
}

function printTimeout(num: Number) {
    return {
        value: `${num} Seconds`,
        short: num,
    };
}

function getFeature(name: string): keyof Studio['features'] {
    const features = {
        enabled: 'enabled',
        greetings: 'greetings',
        boardcontrol: 'boardControl',
        challenges: 'challenges',
        dailydoubles: 'dailyDoubles',
        cluemedia: 'clueMedia',
    } as any;

    if (!features.hasOwnProperty(name)) {
        throw new Error('Unknown feature.');
    }

    return features[name];
}

function getTimeoutName(name: string): keyof Studio['timeouts'] {
    const timeouts = {
        clue: 'clue',
        challenge: 'challenge',
        boardcontrol: 'boardControl',
        wager: 'wager',
    } as any;

    if (!timeouts.hasOwnProperty(name)) {
        throw new Error('Unknown timeout.');
    }

    return timeouts[name];
}

export default function* config() {
    yield input(
        [
            /(config)/,
            /config set ([A-z]+)? (on|off)/,
            /config timeout ([A-z]+)? (\d+)/,
            /(config global)/,
            /config global set ([A-z]+)? (on|off)/,
        ],
        function*(
            action,
            [
                [channelConfigHelp],
                [setChannelConfigName, setChannelConfigValue],
                [setChannelTimeoutName, setChannelTimeoutValue],
                [globalConfigHelp],
                [setGlobalConfigName, setGlobalConfigValue],
            ],
        ) {
            if (setGlobalConfigName) {
                if (setGlobalConfigName === 'studiosenabledbydefault') {
                    yield put(
                        setStudiosEnabledByDefault(
                            setGlobalConfigValue === 'on',
                        ),
                    );
                }
                yield say(
                    `Changed global configuration \`${setGlobalConfigName}\` to \`${setGlobalConfigValue}\``,
                );
            } else if (globalConfigHelp) {
                const config = yield selectConfig();
                yield say('Here is the global configuration for the bot.', {
                    attachments: [
                        {
                            fallback: 'Configuration for the Jeopardy Bot.',
                            color: '#162387',
                            fields: [
                                {
                                    title:
                                        'Studios Enabled By Default (`studiosEnabledByDefault`)',
                                    ...yesOrNo(config.studiosEnabledByDefault),
                                },
                            ],
                            footer:
                                'You can set any global configuration with `config global set <name> [on|off]`',
                        },
                    ],
                });
            } else if (channelConfigHelp) {
                const studio: Studio = yield selectStudio(action.studio);

                yield say(
                    'Here are the configuration options for this channel.',
                    {
                        attachments: [
                            {
                                fallback: 'Configuration for the Jeopardy Bot.',
                                color: '#162387',
                                text: 'Game features:',
                                fields: [
                                    {
                                        title:
                                            'Bot enabled in channel (`enabled`)',
                                        ...yesOrNo(studio.enabled),
                                    },
                                    {
                                        title: 'Room greetings (`greetings`)',
                                        ...yesOrNo(studio.features.greetings),
                                    },
                                    {
                                        title: 'Board control (`boardControl`)',
                                        ...yesOrNo(
                                            studio.features.boardControl,
                                        ),
                                    },
                                    {
                                        title:
                                            'Question challenges (`challenges`)',
                                        ...yesOrNo(studio.features.challenges),
                                    },
                                    {
                                        title: 'Daily doubles (`dailyDoubles`)',
                                        ...yesOrNo(
                                            studio.features.dailyDoubles,
                                        ),
                                    },
                                    {
                                        title: 'Clue Media (`clueMedia`)',
                                        ...yesOrNo(studio.features.clueMedia),
                                    }
                                ],
                                footer:
                                    'You can toggle any channel-specific features with `config set <name> [on|off]`',
                            },
                            {
                                fallback: 'Configuration for the Jeopardy Bot.',
                                color: '#162387',
                                text: 'Timeouts:',
                                fields: [
                                    {
                                        title: 'Clue timeout (`clue`)',
                                        ...printTimeout(studio.timeouts.clue),
                                    },
                                    {
                                        title:
                                            'Challenge timeout (`challenge`)',
                                        ...printTimeout(
                                            studio.timeouts.challenge,
                                        ),
                                    },
                                    {
                                        title: 'Board control (`boardControl`)',
                                        ...printTimeout(
                                            studio.timeouts.boardControl,
                                        ),
                                    },
                                    {
                                        title: 'Daily double wager (`wager`)',
                                        ...printTimeout(studio.timeouts.wager),
                                    },
                                ],
                                footer:
                                    'You can set any channel-specific timeouts with `config timeout <name> <value>`',
                            },
                        ],
                    },
                );
            } else if (setChannelConfigName) {
                try {
                    if (setChannelConfigName === 'enabled') {
                        yield put(
                            setEnabled(
                                action.studio,
                                setChannelConfigValue === 'on',
                            ),
                        );
                    } else {
                        yield put(
                            toggleFeature(
                                action.studio,
                                getFeature(setChannelConfigName),
                                setChannelConfigValue === 'on',
                            ),
                        );
                    }
                    yield say(
                        `Changed channel feature \`${setChannelConfigName}\` to \`${setChannelConfigValue}\``,
                    );
                } catch (e) {
                    yield say(
                        `We were unable to set the config "${setChannelConfigName}". Please try again.`,
                    );
                }
            } else if (setChannelTimeoutName) {
                try {
                    yield put(
                        setTimeoutValue(
                            action.studio,
                            getTimeoutName(setChannelTimeoutName),
                            Number(setChannelTimeoutValue),
                        ),
                    );
                    yield say(
                        `Changed channel timeout \`${setChannelTimeoutName}\` to \`${setChannelTimeoutValue}\``,
                    );
                } catch (e) {
                    yield say(
                        `We were unable to set the timeout "${setChannelTimeoutName}". Please try again.`,
                    );
                }
            }
        },
        {
            // Allow config input to be processed in channels that aren't enabled:
            ignoreEnabled: true,
        },
    );
}
