import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { startAutoCloseJob } from './jobs/autoClosePunches.job';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 PonchEO API running on http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);

  // Start the nightly auto-close job for orphan punches
  startAutoCloseJob();
});
