const request = require('request-promise');

const isCi = process.env.CI;
const netlifyApiBase = 'https://api.netlify.com/api/v1';
const netlifyApiKey = process.env.NETLIFY_API_KEY;
const tagName = process.env.CIRCLE_TAG;

if (!isCi) {
  console.error('Not running in a CI environment. Exiting.');
  process.exit(1);
}
if (!tagName) {
  console.error('Missing tag name. Exiting.');
  process.exit(1);
}
if (!netlifyApiKey) {
  console.error('Missing Netlify api key. Exiting.');
  process.exit(1);
}

const makeNetlifyRequest = (method, url) =>
  request({
    method,
    url,
    headers: {
      Authorization: `Bearer ${netlifyApiKey}`,
    },
    json: true,
  });

(async () => {
  const sites = await makeNetlifyRequest(
    'GET',
    `${netlifyApiBase}/sites`,
  );

  const site = sites.find(site => site.name === 'optimistic-lewin-16526a');

  const { id: siteId } = site;

  let taggedDeploy;

  do {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const deploys = await makeNetlifyRequest(
      'GET',
      `${netlifyApiBase}/sites/${siteId}/deploys`,
    );

    taggedDeploy = deploys.find(deploy =>
      deploy.context === 'branch-deploy' &&
      deploy.branch === tagName &&
      deploy.state in ['failed', 'ready'],
    );
  } while (!taggedDeploy);

  if (taggedDeploy === 'failed') {
    console.error('Build failed. Exiting.');
    process.exit(1);
  }

  const { id: deployId } = taggedDeploy;

  await makeNetlifyRequest(
    'POST',
    `${netlifyApiBase}/sites/${siteId}/deploys/${deployId}/restore`,
  );
})();
