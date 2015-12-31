# Cola2

All of the image-related stuff got super messy to maintain, so I put it into one place, and called it Cola. It primarily consists of the image generation logic for the jeopardy boards (`generator`), and the adapters, which are responsible for handling image uploads (S3 and imgur).

As of Cola2, all of the images are generated in Node, which results in pretty great performance, even when using the Imgur adapter.
