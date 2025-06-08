// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NODE_ENV === 'production' 
    ? 'https://3494855739c606c741354aaf4fd4bb9e@o4509317800853504.ingest.us.sentry.io/4509317805834240'
    : undefined, // Disable in development

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0, // Lower sample rate

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Disable Sentry in development
  enabled: process.env.NODE_ENV === 'production',
});
