declare module 'canvas' {
    export class Image {
        public src: Buffer;
        public width: number;
        public height: number;
        // This makes the Image type compatible with the canvas:
        close(): void;
    }

    export default class Canvas {
        constructor(width: number, height: number);
        getContext(type: '2d'): CanvasRenderingContext2D;
        toBuffer(callback: (err: Error, buffer: Buffer) => void): void;
    }
}
