# Trebek

Trebek is the brains of Jeopardy Bot. It contains all of the various commands.

We use *Redux Saga* to control the game flow. We don't implement the full game as a saga, and instead use sagas for each individual command. This gives us a level of resliency for reboots, as the game can continue even if the app was restarted half-way through.

## Sagas

Each sagas represents a command, such as "new game", or "poke". These sagas generally wait on either text input, or a Slack event, and then run some logic. Sagas can leverage `requirements`, which require the game to be in a specific state.

## State

The state is all stored in Redux. This allows us to represent the current state of the world as a giant javascript object, which can be serialized / deserialized to handle restarts.
