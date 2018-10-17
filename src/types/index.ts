import { WebAPICallResult } from '@slack/client';

// The slack API is not strongly typed, so we'll fake it here:
export interface SlackResponse extends WebAPICallResult {
    ts: string;
    channel: string;
    messages: {
        ts: string;
        files: {
            id: string;
            url_private: string;
        }[];
    }[];
    user: {
        profile: {
            display_name: string;
        };
    };
}

export interface SlackMessage {
    text: string;
    channel: string;
    user: string;
    ts: string;
}

export interface SlackEvent {
    channel?: string;
    user?: string;
}

export interface BaseAction {
    type: string;
    payload: {
        [key: string]: any;
    };
    contestant: string;
    studio: string;
}

export interface JeopardyImage {
    buffer: Buffer;
    filename: string;
}

export interface Clue {
    id: number;
    categoryId: number;
    question: string;
    answer: string;
    value: number;
    media: string[];
    dailyDouble: boolean;
    answered: boolean;
}

export interface Category {
    id: number;
    title: string;
}

export interface ClueWithCategory extends Clue {
    category: Category;
}

export interface Game {
    questions: Clue[];
    categories: Category[];
    recentCategory?: number;
}

export interface Contestant {
    id: string;

    // The current scores for contestants in a given channel.
    scores: {
        [channel: string]: number;
    };

    stats: {
        // Aggregate of all of the money won/lost from all games.
        money: number;
        // Number of games won:
        won: number;
        // Number of games lost:
        lost: number;
    };
}

export interface Studio {
    id: string;
    enabled: boolean;
    timeouts: {
        clue: number;
        challenge: number;
        boardControl: number;
        wager: number;
    };
    // Feature flags:
    features: {
        challenges: boolean;
        boardControl: boolean;
        dailyDoubles: boolean;
        greetings: boolean;
        clueMedia: boolean;
    };
    stats: {
        games: number;
        guesses: number;
    };
}

export interface ReduxState {
    contestants: {
        [id: string]: Contestant;
    };
    games: {
        [id: string]: Game;
    };
    studios: {
        [id: string]: Studio;
    };
    config: {
        studiosEnabledByDefault: boolean;
    };
}
