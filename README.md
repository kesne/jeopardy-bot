# JeopardyBot

A Slack bot that lets you play full Jeopardy! games. Easy to deploy, and highly configurable to your team's style of play.

<img width="383" alt="JeopardyBot Screenshot" src="https://cloud.githubusercontent.com/assets/498479/12258733/9edc2464-b8c5-11e5-8703-3187ced93f15.png">

## Deploying on Heroku

Deploying JeopardyBot on Heroku is extremely simple. Simply click the deploy button below.

Once your instance is deployed, click the "**View**" button, and the JeopardyBot admin panel will open, and walk you through the setup process for Slack.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

You can also go to the admin panel directly by navigating to `<appname>.herokuapp.com/admin`. The username and password should be configured during the heroku deploy process, and default to `jeopardy` and `bot`, respectively.

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

You can configure the bot by using the admin control panel. You can go to the admin panel directly by navigating to `/admin` on the domain that the bot is deployed to. If you deployed on Heroku, the username and password should be configured during the heroku deploy process, and default to `jeopardy` and `bot`, respectively. Otherwise, you can set the username and password with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables.


### Configuring MongoDB

There are three different environment variables that you can use to set the URL for MongoDB. JeopardyBot will check the environment variables `MONGO_URL`, `MONGOHQ_URL`, and `MONGOLAB_URI` (in that order), before finally defaulting to `mongodb://localhost/jeopardy`.
