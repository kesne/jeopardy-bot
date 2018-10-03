export interface BaseAction {
    type: string;
    payload: {
        [key: string]: any;
    };
    contestant: {
        id: string;
    };
    studio: {
        id: string;
    };
}
