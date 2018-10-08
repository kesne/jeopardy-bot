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
