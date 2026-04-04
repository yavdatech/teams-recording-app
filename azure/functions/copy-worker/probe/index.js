module.exports = async function (context, req) {
  context.log('[probe] called');
  context.res = {
    status: 200,
    body: {
      status: 'ok',
      time: new Date().toISOString()
    },
    headers: {
      'Content-Type': 'application/json'
    }
  };
};
