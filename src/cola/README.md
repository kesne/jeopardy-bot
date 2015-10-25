# Cola

All of the image-related stuff got super messy to maintain, so I put it into one place, and called it Cola. It primarily consists of the image generation logic for the jeopardy boards (capture and generator), and the uploaders (S3 and imgur).

The new image generation is a mixed bag of old-style screenshots of webpages (for the clue pages and the category headers), and the new-style image building. In the future, we might generate all of the images in Node.

## Imgur Uploader

This is a simple uploader aimed at just uploading what it's asked to, and then returning a url for the image. It doesn't do any magic, or optimization (outside of image minification). This is aimed to be a zero-configuration option, but it not the fastest solution.

## S3 Uploader

The S3 uploader aims to be more robust than the imgur uploader. S3 as a storage medium is more reliable, and creating objects on S3 is less prone to failure than the imgur api. Because it acts as a storage medium that we can also read from, it actively works through the games' jeopardy clues to generate and upload any images it can before the user might hit them. This way, the only latency is from slack itself.
