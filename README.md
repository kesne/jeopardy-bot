# JeopardyBot

A Slack bot that lets you play full Jeopardy! games. Easy to deploy, and highly configurable to your team's style of play.

<img width="383" alt="JeopardyBot Screenshot" src="https://cloud.githubusercontent.com/assets/498479/12258733/9edc2464-b8c5-11e5-8703-3187ced93f15.png">

## Deploying

### Now

<p align="center">
    <img alt="Now logo" src="https://assets.zeit.co/image/upload/front/assets/design/black-now-triangle.png" width="350">
</p>

Deploying with [now](https://zeit.co/now) is simple, and there is a free tier that you can use to run the Jeopardy Bot application.

1. Follow the [Getting Started guide](https://zeit.co/now#get-started).
2. Clone the project: `$ git clone https://github.com/kesne/jeopardy-bot.git && cd jeopardy-bot`
3. Run now in the project to deploy it: `$ now`. You will be prompted to provide a `SLACK_TOKEN`.

You're good to go! Invite the bot into a channel on slack, and start a game by saying "**new game**"!

### Heroku

Deploying with [Heroku](https://heroku.com) is possible, however if you're using a free plan, the deployment will sleep after 30 minutes of inactivity, and you'll need to manually restart the deployment. For this reason, it is not our preferred hosting provider. If you'd like to deploy on Heroku, you can use the button below:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/kesne/jeopardy-bot)

### Docker

A docker image containing the bot is published and can easily be used as well. You will need to create a `SLACK_TOKEN` for the bot, and provide it via an environment variable when running the container.

```
$ docker pull jeopardybot/bot
$ docker run -e "SLACK_TOKEN=<slack-token-here>" -d jeopardybot/bot
```

## How to Play

When in doubt, just type "help" in the channel and a message will appear to help you out.

```
*Games*
    “help” - Displays this helpful message.
    “new game” - Starts a new game.
    “end game” - Ends the current game.
*Selecting Categories*
    “I’ll take ________ for $___”
    “Give me ________ for $___”
    “Choose ________ for $___”
    “________ for $___”
    “Same (category) for $___”
    “Gimme ________”
*Guessing*
    “What [is|are] _______”
    “Who [is|are] ________”
    “Where [is|are] ______”
    “When [is|are] ______”
*Wagering*
    “(I'll) wager $___”
    “$___”
*Scores*
    “scores” - Shows the scores for the current game.
    “leaderboard” - Shows the scores for the top players.
    “loserboard” - Shows the scores for the bottom players.
*Configuration*
    “config” - Shows the configuration for the current channel
    “config global” - Shows the global configuration
 ```

You can also ensure that the bot is awake by messaging "poke". This is useful for free Heroku dynos, which may get shut down after inactivity.

## Configuring

The slack bot is configured via slack commands. To explore the configuration options available, simply say "**config**".

### Persistence

Persistence works out of the box by periodically uploading a dump of the configuration to slack itself. The sync occurs every 5 minutes, and whenever the process is gracefully exited. If the process exits and is unable to sync, it may lose up to 5 minutes of data.
