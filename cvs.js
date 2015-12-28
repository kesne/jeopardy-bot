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

    ctx.font = '27px "League Gothic"';
    ctx.fillStyle = 'white';
    ctx.fillText('Awesome!', 50, 100);

    const me = ctx.measureText('Awesome!');
    console.log(me);


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
