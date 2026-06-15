import { router } from '../router.js';
import { HERE_NOW_API_KEY } from '../config.js';
import { publishToHereNow } from '../herenow.js';

router.post('/api/share/herenow', async (req, res) => {
  if (!HERE_NOW_API_KEY) {
    res.json({ error: 'here.now API key not configured' }, 400);
    return;
  }

  const { content } = await req.json();
  if (!content) {
    res.json({ error: 'Content is required' }, 400);
    return;
  }

  try {
    const url = await publishToHereNow(content);
    console.log(`  📤 here.now: ${url}`);
    res.json({ url });
  } catch (err) {
    console.log(`  ❌ Share failed: ${err.message}`);
    res.json({ error: err.message }, 500);
  }
});
