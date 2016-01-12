# JeopardyBot

A slack bot that lets you play full Jeopardy! games. Easy to deploy, and highly configurable to your team's style of play.

## Deploying on Heroku

Deploying on Heroku is extremely simple and most automated. Just click the deploy button below.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Once your instance is deployed, the JeopardyBot admin panel will open, and walk you through the setup process for Slack.

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



### Configuring MongoDB

There are three different environment variables that you can use to set the URL for MongoDB. JeopardyBot will check the environment variables `MONGO_URL`, `MONGOHQ_URL`, and `MONGOLAB_URI` (in that order), before finally defaulting to `mongodb://localhost/jeopardy`.
