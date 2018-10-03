// TODO: Arbitrary split for non-fitting words. Attempt to split on the dash
// (tokenize with dash + custom reducer).
export default function wrapText(ctx, text, maxWidth) {
  const tokens = text
    .trim()
    .toUpperCase()
    .split(/(-)|\s/)
    .filter(n => n);

  const lines = [tokens];

  let activeLine = 0;
  let validLayout = false;

  do {
    let fits = false;
    const m = ctx.measureText(lines[activeLine]);
    if (m.width > maxWidth) {
      // Move this word to the beginning of the next line:
      if (!lines[activeLine + 1]) lines.push([]);
      lines[activeLine + 1].unshift(lines[activeLine].pop());
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
