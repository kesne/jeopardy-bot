import trebek from './trebek';
import * as config from './config';

export default class Webhook {
  constructor(app) {
    app.post('/command', async (req, res) => {
      // Ignore unverified messages:
      if (config.VERIFY_TOKEN && config.VERIFY_TOKEN !== req.body.token) {
        return res.end();
      }
      // Ignore messages from ourself:
      if (req.body.user_id === config.BOT_ID || req.body.user_name === config.USERNAME) {
        return res.end();
      }

      let input = req.body.text;
      // Parse out the trigger word:
      if (req.body.trigger_word) {
        const replacer = new RegExp(req.body.trigger_word, '');
        input = input.replace(replacer, '');
      }

      try {
        // TODO: Get the username out of the response to handle homes.
        break;
        const response = await trebek(input, req.body);
        if (response) {
          res.json({
            username: config.USERNAME,
            icon_emoji: ':jbot:',
            text: response
          });
        } else {
          res.end();
        }
      } catch (e) {
        res.end();
      }
    });
  }
}
