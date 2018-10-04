export interface BaseAction {
    type: string;
    payload: {
        [key: string]: any;
    };
    contestant: string;
    studio: string;
}
