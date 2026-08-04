#!/usr/bin/env node

const {
	DOKPLOY_URL,
	DOKPLOY_API_KEY,
	DOKPLOY_TEMPLATE_APPLICATION_ID,
	PR_NUMBER,
	IMAGE,
	GHCR_USERNAME,
	GHCR_PASSWORD,
	GHCR_REGISTRY = 'ghcr.io',
	PREVIEW_HOST_SUFFIX = 'bootpack.work'
} = process.env;

const command = process.argv[2];
const APP_NAME = `lazy-uncle-pr-${PR_NUMBER}`;
const HOST = `${APP_NAME}.${PREVIEW_HOST_SUFFIX}`;
const APP_PORT = 3000;

function required(name, value) {
	if (!value) throw new Error(`Missing required env: ${name}`);
}

async function call(path, { method = 'POST', query, body } = {}) {
	let url = `${DOKPLOY_URL}/api/${path}`;
	if (query) url += `?${new URLSearchParams(query)}`;

	const response = await fetch(url, {
		method,
		headers: {
			'x-api-key': DOKPLOY_API_KEY,
			'Content-Type': 'application/json',
			accept: 'application/json'
		},
		body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined
	});
	const text = await response.text();
	if (!response.ok) {
		throw new Error(`${method} /api/${path} -> ${response.status}: ${text.slice(0, 500)}`);
	}

	let result;
	try {
		result = text ? JSON.parse(text) : null;
	} catch {
		result = text;
	}
	return result && typeof result === 'object' && 'data' in result ? result.data : result;
}

async function query(path, params) {
	try {
		return await call(path, { method: 'GET', query: params });
	} catch (error) {
		const status = Number(String(error.message).match(/-> (\d+):/)?.[1]);
		if ([400, 404, 405].includes(status)) return call(path, { body: params });
		throw error;
	}
}

function getEnvValue(env, key) {
	const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'));
	return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
}

function materializePreviewEnv(env) {
	const result = env
		.replaceAll('${{DOKPLOY_DEPLOY_URL}}', HOST)
		.replaceAll('${{ DOKPLOY_DEPLOY_URL }}', HOST)
		.replaceAll('${DOKPLOY_DEPLOY_URL}', HOST)
		.replaceAll('$DOKPLOY_DEPLOY_URL', HOST);

	if (result.includes('DOKPLOY_DEPLOY_URL')) {
		throw new Error('Preview env still contains DOKPLOY_DEPLOY_URL after substitution.');
	}
	const authUrl = getEnvValue(result, 'BETTER_AUTH_URL');
	if (authUrl !== `https://${HOST}`) {
		throw new Error(
			`Preview BETTER_AUTH_URL is "${authUrl}", expected "https://${HOST}".`
		);
	}
	return result;
}

function assertPreviewDatabase(previewEnv, productionEnv) {
	const previewDatabase = getEnvValue(previewEnv, 'DATABASE_URL');
	const productionDatabase = getEnvValue(productionEnv, 'DATABASE_URL');
	if (!previewDatabase) throw new Error('Preview env has no DATABASE_URL; refusing to deploy.');
	if (productionDatabase && previewDatabase === productionDatabase) {
		throw new Error('Preview DATABASE_URL matches production; refusing to deploy.');
	}
}

async function getTemplate() {
	const app = await query('application.one', {
		applicationId: DOKPLOY_TEMPLATE_APPLICATION_ID
	});
	if (!app.previewEnv?.trim()) {
		throw new Error('The Dokploy application has no preview environment configured.');
	}
	if (!app.environmentId) {
		throw new Error('The Dokploy application response has no environmentId.');
	}
	return app;
}

async function findAppId(environmentId) {
	const environment = await query('environment.one', { environmentId });
	const applications = environment.applications || environment.services?.applications || [];
	return applications.find((application) => application.name === APP_NAME)?.applicationId || null;
}

async function deploy() {
	required('IMAGE', IMAGE);
	required('GHCR_USERNAME', GHCR_USERNAME);
	required('GHCR_PASSWORD', GHCR_PASSWORD);

	const template = await getTemplate();
	const env = materializePreviewEnv(template.previewEnv);
	assertPreviewDatabase(env, template.env || '');
	const credentials = {
		dockerImage: IMAGE,
		registryUrl: GHCR_REGISTRY,
		username: GHCR_USERNAME,
		password: GHCR_PASSWORD
	};

	let applicationId = await findAppId(template.environmentId);
	if (!applicationId) {
		console.log(`Creating preview app ${APP_NAME}...`);
		const created = await call('application.create', {
			body: { name: APP_NAME, environmentId: template.environmentId }
		});
		applicationId = created.applicationId;
		await call('domain.create', {
			body: {
				applicationId,
				domainType: 'application',
				host: HOST,
				port: APP_PORT,
				https: true,
				certificateType: 'letsencrypt',
				stripPath: false
			}
		});
	} else {
		console.log(`Updating preview app ${APP_NAME} (${applicationId})...`);
	}

	await call('application.saveDockerProvider', {
		body: { applicationId, ...credentials }
	});
	await call('application.update', {
		body: { applicationId, sourceType: 'docker', autoDeploy: false, env }
	});
	await call('application.deploy', { body: { applicationId } });
	console.log(`Preview URL: https://${HOST}`);

	if (process.env.GITHUB_OUTPUT) {
		const { appendFileSync } = await import('node:fs');
		appendFileSync(process.env.GITHUB_OUTPUT, `preview_url=https://${HOST}\n`);
	}
}

async function teardown() {
	const template = await getTemplate();
	const applicationId = await findAppId(template.environmentId);
	if (!applicationId) {
		console.log(`No preview app named ${APP_NAME} to delete.`);
		return;
	}
	await call('application.delete', { body: { applicationId } });
	console.log(`Deleted preview app ${APP_NAME} (${applicationId}).`);
}

async function main() {
	required('DOKPLOY_URL', DOKPLOY_URL);
	required('DOKPLOY_API_KEY', DOKPLOY_API_KEY);
	required('DOKPLOY_TEMPLATE_APPLICATION_ID', DOKPLOY_TEMPLATE_APPLICATION_ID);
	required('PR_NUMBER', PR_NUMBER);

	if (command === 'deploy') return deploy();
	if (command === 'teardown') return teardown();
	throw new Error('Usage: dokploy-preview.mjs <deploy|teardown>');
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
