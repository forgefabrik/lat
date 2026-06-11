import { Router } from './routes';
import type { Env } from './env';

export default {
  fetch: Router.handle,
} satisfies ExportedHandler<Env>;