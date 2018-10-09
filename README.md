# JeopardyBot (v2)
## This branch is a complete rewrite of Jeopardy Bot. It is not complete yet, and I do not currently recommend installing it.

A Slack bot that lets you play full Jeopardy! games. Easy to deploy, and highly configurable to your team's style of play.

<img width="383" alt="JeopardyBot Screenshot" src="https://cloud.githubusercontent.com/assets/498479/12258733/9edc2464-b8c5-11e5-8703-3187ced93f15.png">

## TODO:

- Figure out docker image.
- Update deploy button.
- Move state selects into selector functions.
- Build out the configuration via slack.
    - Ideally this would be something like you pinging it with `config`, and it'll prompt you with some buttons.
    - Open to anyone, so anyone can configure it.
- Publish docker file.
- Persist on exit request.
- Help should DM the user, or send a message to just that user. (the ephemeral message stuff)

## Deploying

### Now

<div style="text-align: center">
    <img alt="Now logo" src="https://assets.zeit.co/image/upload/front/assets/design/black-now-triangle.png" width="350">
</div>

Deploying with [now](https://zeit.co/now) is simple, and there is a free tier that you can use to run the Jeopardy Bot application.

1. Follow the [Getting Started guide](https://zeit.co/now#get-started).
2. Clone the project: `$ git clone https://github.com/kesne/jeopardy-bot.git && cd jeopardy-bot`
3. Run now in the project to deploy it: `$ now`. You will be prompted to provide a `SLACK_TOKEN`.

You're good to go! Invite the bot into a channel on slack, and start a game by saying "**new game**"!

### Heroku

Deploying with [Heroku](https://heroku.com) is possible, however if you're using a free plan, the deployment will sleep after 30 minutes of inactivity, and you'll need to manually restart the deployment. For this reason, it is not our preferred hosting provider. If you'd like to deploy on Heroku, you can use the button below:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/kesne/jeopardy-bot)

### Docker

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
 ```

You can also ensure that the bot is awake by messaging "poke". This is useful for free Heroku dynos, which may get shut down after inactivity.

## Configuring

The slack bot is configured via slack commands. To explore the configuration options available, simply say "**config**".

### Configuring Persistence

Persistence works out of the box by periodically uploading a dump of the configuration to slack itself. The sync occurs every 5 minutes, and whenever the process is gracefully exited. If the process exits and is unable to sync, it may lose up to 5 minutes of data.
