export default function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
) {
    const tokens = text
        .trim()
        .toUpperCase()
        .split(/(-)|\s/)
        .filter(n => n);

    // We can't split one word:
    if (tokens.length === 1) {
        return [tokens];
    }

    const lines = [tokens];

    let activeLine = 0;
    let validLayout = false;

    do {
        let fits = false;
        const m = ctx.measureText(lines[activeLine].join(' '));
        if (m.width > maxWidth) {
            // Move this word to the beginning of the next line:
            if (!lines[activeLine + 1]) lines.push([]);
            lines[activeLine + 1].unshift(lines[activeLine].pop() as string);
        } else {
            fits = true;
            activeLine++;
        }
        // We're done:
        if (activeLine >= lines.length && fits) {
            validLayout = true;
        }
    } while (!validLayout);

    return lines;
}
