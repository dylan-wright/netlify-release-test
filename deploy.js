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

(async () => {
  const sites = await request({
    method: 'GET',
    headers: {
      Authorization: `Bearer ${netlifyApiKey}`,
    },
    url: `${netlifyApiBase}/sites`,
    json: true,
  });

  const site = sites.find(site => site.name === 'optimistic-lewin-16526a');

  const { id } = site;

  let taggedDeploy;

  do {
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('trying');

    const deploys = await request({
      method: 'GET',
      headers: {
        Authorization: `Bearer ${netlifyApiKey}`,
      },
      url: `${netlifyApiBase}/sites/${id}/deploys`,
      json: true,
    });

    taggedDeploy = deploys.find(deploy =>
      deploy.context === 'branch-deploy' &&
      deploy.branch === tagName &&
      deploy.state === 'ready'
    );

  } while (!taggedDeploy);
  console.log(taggedDeploy);
})();
