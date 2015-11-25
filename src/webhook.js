import trebek from './trebek';
import App from './models/App';

export default class Webhook {
  constructor(app) {
    app.post('/command', async (req, res) => {
      const app = await App.get();
      // Ignore unverified messages:
      if (app.verify_token && app.verify_token !== req.body.token) {
        return res.end();
      }
      // Ignore messages from ourself:
      if (req.body.user_name.toLowerCase() === app.username.toLowerCase()) {
        return res.end();
      }

      let input = req.body.text;
      // Parse out the trigger word:
      if (req.body.trigger_word) {
        const replacer = new RegExp(req.body.trigger_word, '');
        input = input.replace(replacer, '');
      }

      try {
        // break;
        const response = await trebek(input, req.body);
        if (response) {
          res.json({
            username: app.username,
            icon_emoji: app.icon_emoji,
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
