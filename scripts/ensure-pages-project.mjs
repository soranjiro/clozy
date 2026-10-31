// Run only in the deployment job, with credentials scoped to Cloudflare Pages.
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!accountId || !token) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in GitHub Actions repository secrets.');
}

const projectName = 'clozy';
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const response = await fetch(`${endpoint}/${projectName}`, { headers });
let project;
if (response.ok) {
  const body = await response.json();
  if (!body.success) throw new Error('Cloudflare could not read the Pages project.');
  project = body.result;
} else if (response.status === 404) {
  const created = await fetch(endpoint, {
    method: 'POST', headers,
    body: JSON.stringify({ name: projectName, production_branch: 'main' })
  });
  const body = await created.json();
  if (!created.ok || !body.success) {
    throw new Error(`Cloudflare Pages project creation failed (HTTP ${created.status}). Check account permissions and project name availability.`);
  }
  project = body.result;
} else {
  throw new Error(`Cloudflare Pages authentication/project lookup failed (HTTP ${response.status}).`);
}

if (project.production_branch !== 'main') {
  throw new Error('The Pages production branch must be main. Refusing to deploy.');
}
if (project.source) {
  throw new Error('This Pages project has Git integration enabled. Use a Direct Upload project to avoid duplicate deployments.');
}
console.log(`Pages project ready: https://${project.subdomain}`);
