import fs from 'fs';
import opentype from 'opentype.js';
import Canvas, { Image } from 'canvas';
import winston from 'winston';

opentype.load('assets/fonts/LeagueGothic-Regular.woff', function(err, font) {
  winston.profile('render');
  if (err) {
    console.log('Font could not be loaded: ' + err);
  } else {
    const canvas = new Canvas(194, 102);
    const ctx = canvas.getContext('2d');

    const imgsrc = fs.readFileSync(__dirname + '/assets/blank_category.png');
    const img = new Image();
    img.src = imgsrc;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    ctx.shadowColor = 'black';
    ctx.shadowBlur = 3;

    const fpath = font.getPath('Pop goes the category.'.toUpperCase(), 0, 20, 27);
    fpath.fill = 'white';
    // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).
    // fpath.draw(ctx);

    const MAX_DISPLAY_WIDTH = 180;
    const LINE_HEIGHT = 27;
    const text = 'Pop goes the category. Overflows it does. And then you'.toUpperCase();
    const tokens = text.split(' ');
    const lines = [tokens];

    let validLayout = false;
    let activeLine = 0;


    ctx.font = '27px "League Gothic"';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';

    do {
      let fits = false;
      const m = ctx.measureText(lines[activeLine]);
      if (m.width > MAX_DISPLAY_WIDTH) {
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

    console.log(lines);

    lines.forEach((l, i) => {
      const line = l.join(' ');
      if (lines.length === 1) {
        ctx.fillText(line, 194 / 2, 100);
      } else if (lines.length === 2) {
        ctx.fillText(line, 194 / 2, 45 + LINE_HEIGHT * i);
      } else if (lines.length === 3) {
        ctx.fillText(line, 194 / 2, 33 + LINE_HEIGHT * i);
      }
    });


    // Saving logic:

    var out = fs.createWriteStream(__dirname + '/text.png');
    var stream = canvas.pngStream();

    stream.on('data', function(chunk){
      out.write(chunk);
    });

    stream.on('end', function(){
      console.log('saved png');
    });
  }
  winston.profile('render');
});
