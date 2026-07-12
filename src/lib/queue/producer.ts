export async function enqueueSheetSync(eventId: string) {
  // In development, or if the queue binding is not available, we can just skip it
  // and let the Cron Trigger handle the sync eventually.
  
  // @ts-ignore - Cloudflare Queues binding injected by OpenNext/Wrangler
  const queue = process.env.SHEETS_SYNC_QUEUE || globalThis.SHEETS_SYNC_QUEUE;
  
  if (!queue) {
    console.warn(`[Queue Producer] SHEETS_SYNC_QUEUE binding not found. Skipping immediate sync for event ${eventId}. Cron will catch up.`);
    return;
  }

  try {
    // Send a message to the queue
    await queue.send({ eventId });
    console.log(`[Queue Producer] Queued sheet sync for event ${eventId}`);
  } catch (error) {
    console.error(`[Queue Producer] Failed to enqueue sheet sync for event ${eventId}:`, error);
  }
}
