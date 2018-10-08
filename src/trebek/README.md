# Trebek

Trebek is the brains of Jeopardy Bot. It contains all of the various commands.

We use *Redux Saga* to control the game flow. We don't implement the full game as a saga, and instead use sagas for each individual command. This gives us a level of resliency for reboots, as the game can continue even if the app was restarted half-way through.

## Sagas

Each sagas represents a command, such as "new game", or "poke". These sagas generally wait on either text input, or a Slack event, and then run some logic.

The sagas are written so that the game could safely continue in the event of a reboot. We don't attempt to make the game perfectly resume, and allow some local state around things like the currently selected question, board control, and timeouts. In the event of a reboot in the middle of one of those features, the game should just fallback to the default behavior (i.e. no currently selected question, no board control, and no current timeout).

## State

The state for the game is stored in Sagas, and in Redux. The redux state is persistent state that allows the bot to seamlessly handle reboots. The saga state is for local state that does not need to be persisted between reboots.
