/**
 * Cloudflare Worker for handling Queues and Cron Triggers.
 * It relays the batched events to the main Next.js API to process the actual Google Sheets sync.
 * This keeps the heavy dependencies (googleapis, postgres) in the main app.
 */

export interface Env {
  // Environment variables
  NEXT_APP_URL: string;
  SYNC_SECRET: string;
}

export default {
  // Triggered by messages in the Queue
  async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
    const eventIds = new Set<string>();
    
    // Deduplicate event IDs in the batch
    for (const msg of batch.messages) {
      if (msg.body && msg.body.eventId) {
        eventIds.add(msg.body.eventId);
      }
    }

    if (eventIds.size === 0) return;

    // Send the unique event IDs to the Next.js API for processing
    try {
      const response = await fetch(`${env.NEXT_APP_URL}/api/cron/sync-sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SYNC_SECRET}`
        },
        body: JSON.stringify({ eventIds: Array.from(eventIds) })
      });

      if (!response.ok) {
        console.error(`Failed to process queue batch: ${response.status} ${await response.text()}`);
        // If it fails, throw so the messages are retried by Cloudflare
        throw new Error('Upstream sync failed');
      }
    } catch (error) {
      console.error('Queue processing error:', error);
      throw error;
    }
  },

  // Triggered by Cron
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      // We pass an empty array to indicate a full catch-up sync of all active events
      const response = await fetch(`${env.NEXT_APP_URL}/api/cron/sync-sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SYNC_SECRET}`
        },
        body: JSON.stringify({ eventIds: [] })
      });

      if (!response.ok) {
        console.error(`Failed to process cron trigger: ${response.status} ${await response.text()}`);
      }
    } catch (error) {
      console.error('Cron processing error:', error);
    }
  }
};
