import Canvas, { Image } from 'canvas';
import { join } from 'path';
import { readFileSync } from 'fs';
import wrapText from './wrapText';
import { Game, Clue } from '../types';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 740;

// The y-position of the header row:
const CLUE_OFFSET_Y = 118;
const CLUE_HEIGHT = 124;

// Pre-calcuated positions of columns
const COLUMN_LOCATIONS = [6, 205, 404, 603, 802, 1001];

const ASSETS = join(__dirname, '..', '..', 'assets');

const categoryBackground = new Image();
categoryBackground.src = readFileSync(join(ASSETS, 'blank_category.png'));

const blankValue = new Image();
blankValue.src = readFileSync(join(ASSETS, 'blank_value.png'));

function getValueImage(value: number) {
    const image = new Image();
    image.src = readFileSync(join(ASSETS, 'values', `${value}.png`));
    return image;
}

// NOTE: We give this an index type just so that we can easily grab values out of it:
const $values = {
    '200': getValueImage(200),
    '400': getValueImage(400),
    '600': getValueImage(600),
    '800': getValueImage(800),
    '1000': getValueImage(1000),
} as { [key: string]: Image };

/**
 * CANVAS GENERATION:
 */

function drawLines(
    ctx: CanvasRenderingContext2D,
    lines: string[][],
    offsetX: number,
    lineMidpoint: number,
    lineHeight: number,
) {
    const midpoint = lineMidpoint - (lineHeight * lines.length) / 2;
    lines.forEach((lineArray, lineIndex) => {
        const line = lineArray.join(' ');
        ctx.fillText(line, offsetX, midpoint + lineHeight * lineIndex);
    });
}

function generateClueImage(clue: Clue) {
    return new Promise((resolve, reject) => {
        const canvas = new Canvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        const ctx = canvas.getContext('2d');

        const midpoint = CANVAS_HEIGHT / 2 + 37;
        const lineHeight = 50;
        const maxWidth = 650;

        // Blue background:
        ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#26307f';
        ctx.fill();

        // Set up fonts:
        ctx.font = '40px "Korinna"';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Generate lines:
        const lines = wrapText(ctx, clue.question, maxWidth);

        // Draw the lines:
        drawLines(ctx, lines, CANVAS_WIDTH / 2, midpoint, lineHeight);

        canvas.toBuffer((err, buf) => {
            if (err) {
                reject(err);
            } else {
                resolve(buf);
            }
        });
    });
}

function generateBoardImage(game: Game) {
    return new Promise((resolve, reject) => {
        const canvas = new Canvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        const ctx = canvas.getContext('2d');

        // Black background:
        ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'black';
        ctx.fill();

        // Draw values and category backgrounds:
        for (let col = 0; col < COLUMN_LOCATIONS.length; col++) {
            for (let row = 0; row < 6; row++) {
                let offsetHeight = 5;
                let image = categoryBackground;
                // Values:
                if (row !== 0) {
                    offsetHeight = CLUE_HEIGHT * (row - 1) + CLUE_OFFSET_Y;
                    // Draw the dollar values:
                    const question = game.questions[(row - 1) * 6 + col];
                    image = question.answered
                        ? blankValue
                        : $values[String(question.value)];
                }

                ctx.drawImage(
                    image,
                    COLUMN_LOCATIONS[col],
                    offsetHeight,
                    image.width,
                    image.height,
                );
            }
        }

        // Font for category titles:
        ctx.font = '27px "League Gothic"';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const maxWidth = 180;
        const lineHeight = 27;

        game.categories.forEach((category, i) => {
            const lines = wrapText(ctx, category.title, maxWidth);

            // Draw the lines:
            const linePos = 194 / 2 + COLUMN_LOCATIONS[i];
            const lineMidpoint = 78;

            drawLines(ctx, lines, linePos, lineMidpoint, lineHeight);
        });

        canvas.toBuffer((err, buf) => {
            if (err) {
                reject(err);
            } else {
                resolve(buf);
            }
        });
    });
}

const DAILY_DOUBLE_BUFFER = readFileSync(join(ASSETS, 'dailydouble.png'))
export async function dailyDoubleImage() {
    return {
        buffer: DAILY_DOUBLE_BUFFER,
        filename: 'Daily Double',
    }
}

export async function boardImage(game: Game) {
    const buffer = await generateBoardImage(game);
    return {
        buffer,
        filename: 'Jeopardy Board',
    };
}

export async function clueImage(clue: Clue) {
    const buffer = await generateClueImage(clue);
    return {
        buffer,
        filename: 'Jeopardy Clue',
    };
}
