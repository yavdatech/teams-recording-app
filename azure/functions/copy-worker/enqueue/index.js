const { QueueClient } = require("@azure/storage-queue");

module.exports = async function (context, req) {
  context.log('HTTP enqueue received', req.body && req.body.sourceDriveId);

  const connectionString = process.env.AzureWebJobsStorage;
  if (!connectionString) {
    context.log.error('Missing AzureWebJobsStorage app setting');
    context.res = { status: 500, body: 'Missing storage connection' };
    return;
  }

  const queueName = process.env.QUEUE_NAME || 'recording-copy-queue';
  const queueClient = new QueueClient(connectionString, queueName);

  try {
    const message = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    await queueClient.sendMessage(Buffer.from(message).toString('base64'));
    context.log('Enqueued message to', queueName);
    context.res = { status: 202, body: 'Enqueued' };
  } catch (err) {
    context.log.error('Failed to enqueue', err.message || err);
    context.res = { status: 500, body: 'Enqueue failed' };
  }
};
