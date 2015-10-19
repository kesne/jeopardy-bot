# Jeopardy Bot

A slack bot that lets you play full Jeopardy! games. Easy to deploy, and highly configurable to your team's style of play.

## Deploying on Heroku

Deploying on Heroku is extremely simple. There are currently two supported [modes](#modes) that you can deploy the bot in. Once you've decided which mode you're going to be using, you can follow these instructions.

1. Set up a Slack outgoing webhook at https://my.slack.com/services/new/outgoing-webhook. Configuring a trigger word is optional, and the bot will understand input either way.
2. Grab the token for the outgoing webhook you just created.
3. _(for hybrid mode):_ Obtain an API token. You can can either get one [for you slack account](https://api.slack.com/web), or by [creating a bot account](https://my.slack.com/services/new/bot).
4. Set up the Heroku app by clicking this button. Fill out the fields with the information from the steps above.
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
5. Go into your outgoing webhook configuration and point it to the URL `https://[YOUR-HEROKU-APP].herokuapp.com/command`.

### Recommended Next Steps (optional)

The following steps are not required for the bot to function, but will enhance your experience using it.

- **Bot Icon** - The simplest way to configure the bot icon is to set up a `:jbot:`.  emoji, which will be automatically used. You can [click here](https://my.slack.com/customize/emoji) to add a new emoji. You may also configure the bot image in the Slack configuration settings.
- **Imgur API** - Jeopardy Bot uses Imgur to upload photos for the game. While technically optional, you should set API token to prevent rate limiting. You can get an API key by [clicking here](https://api.imgur.com/oauth2/addclient).

## Usage

When in doubt, just type "help" in the channel and a message will appear to help you out.

```
Games
    “help” - Displays this helpful message.
    “new game” - Starts a new game.
    “end game” - Ends the current game.
Selecting Categories
    “I’ll take ________ for $___”
    “Give me ________ for $___”
    “Choose ________ for $___”
    “ ________ for $___”
    “Same category for $___”
Guessing
    “What [is|are] _______”
    “Who [is|are] ________”
    “Where [is|are] ______”
Wagering
    “$___”
Scores
    “scores” - Shows the score for the current game.
    “leaderboard” - Shows the scores and wins from all games.
 ```

 You can also ensure that the bot is awake by messaging "poke".  This is useful for free Heroku dynos, which may get shut down after inactivity.

_Note: If you configure a trigger word, all of the phrases will be prefixed by that trigger word._

## Configuring

You can configure the bot via environment variables. Most of the configuration options are prefixed with `JBOT_` to prevent conflicts.

- `JBOT_MODE` - The mode that the bot should act in. For more information, [see the section on modes](#modes). Defaults to "response" if no API token is set. If an API token is present, it defaults to "hybrid".
- `JBOT_API_TOKEN` - The API token for "hybrid" mode to send enhanced messages.
- `JBOT_OUTGING_WEBHOOK_TOKEN` - The token from the outgoing webhook, which is used to verify incoming requests.
- `JBOT_USERNAME` _(defaults to "jeopardybot")_ - The username that messages from the bot will be posted as.
- `JBOT_CLUE_TIMEOUT` _(defaults to "45")_ - The number of seconds that users have to answer a clue.
- `JBOT_IMAGE_MIN` _(defaults to "0")_ - When set to "1", this configuration option will compress the images captured before uploading them to Imgur.

### Configuring MongoDB

There are three different environment variables that you can use to set the URL for MongoDB. Jeopardy Bot will check the environment variables `MONGO_URL`, `MONGOHQ_URL`, and `MONGOLAB_URI` (in that order), before finally defaulting to `mongodb://localhost/jeopardy`.

---

## Modes

This slack bot can be configured in two different modes: "response" and "hybrid". We're working on improving the experience by allowing for a pure bot mode as well ((see issue)[https://github.com/kesne/jeopardy-bot/issues/11]).

### Response

Response mode is the easiest way to get Jeopardy Bot up and running in your team. In response mode, the bot acts purely as an outgoing webhook. This allows your integration to be hosted on platforms such as Heroku, which will shut down your application after periods of inactivity.

### Hybrid

Hybrid mode utilizes two slack integrations (outgoing webhook + API token) to provide a superior experience over what is possible with response mode, while still getting the benefits of the outgoing webhook.
