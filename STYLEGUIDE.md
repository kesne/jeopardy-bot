# Styleguide

JeopardyBot is written against the [Airbnb JavaScript Styleguide](https://github.com/airbnb/javascript).

The only rule modifications are the following:

- Allow decorators to use cap names.
- Change `camelcase` to a warning until we comply to it fully.
- Disable the `func-names` rule. This rule makes working with mongoose unnecessarily complicated.
- Allow param reassigning for props (to work better with decorators).
