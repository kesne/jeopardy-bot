# Jeopardy Bot

A cool slack jeopardy bot.

## Configuring

You can configure the bot via environment variables.
All of the configuration options (with one exception) are prefixed with `JBOT_` to prevent conflicts.

- JBOT_TIMEOUT
- JBOT_MODE
- JBOT_ROOMS
- JBOT_VERIFY_TOKENS
- JBOT_API
- JBOT_USERNAME
- JBOT_IMAGE_MIN
- MONGO_URI | MONGOHQ_URI | MONGOLAB_URI

## Modes

This slack bot can be configured in two different modes: "response" and "hybrid". We're working on improving the experience by allowing for a pure bot mode as well (#11).

### Response

Response mode is the easiest way to get Jeopardy Bot up and running in your team. In response mode, the bot acts purely as an outgoing webhook. This allows your integration to be hosted on platforms such as Heroku, which will shut down your application after periods of inactivity.

### Hybrid

Hybrid mode utilizes two slack integrations (outgoing webhook + bot account) to provide a superior experience over what is possible with response mode, while still receiving the benefits of the outgoing webhook.

### Bot (Coming Soon)

This is coming in the future, but it requires your server to be online at all times for users to interact with the bot. If you're using bot mode on the free Heroku plan, we recommend setting up a slash command that will allow you to bring the server up within slack.
