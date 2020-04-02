const core = require('@actions/core')
const github = require('@actions/github')
const { App } = require('@octokit/app')
const { request } = require('@octokit/request')
const path = require('path')
const fs = require('fs')
const os = require('os')

// most @actions toolkit packages have async methods
async function run() {
    const appId = parseInt(core.getInput('app-id'))
    const appPrivateKey = core.getInput('pem-private-key').replace(/\\n/gm, '\n')

    const app = new App({ id: appId, privateKey: appPrivateKey })
    const orgName = github.context.repo.owner
    const jwt = app.getSignedJsonWebToken()

    const { data } = await request("GET /orgs/:owner/installation", {
        owner: orgName,
        headers: {
            authorization: `Bearer ${jwt}`,
            accept: "application/vnd.github.machine-man-preview+json",
        },
    })

    const installationId = data.id
    const installationAccessToken = await app.getInstallationAccessToken({
        installationId,
    })

    const npmrc = path.resolve(process.env['RUNNER_TEMP'] || process.cwd(), '.npmrc')
    const registryUrl = 'https://npm.pkg.github.com/'
    let scope = core.getInput('scope')
    if (!scope) {
        scope = github.context.repo.owner
    }
    if (scope && scope[0] != '@') {
        scope = '@' + scope;
    }
    if (scope) {
        scope = scope.toLowerCase()
    }
    core.debug(`Setting scope to ${scope}`)

    core.debug(`Setting auth in ${npmrc}`)
    let newContents = ''
    if (fs.existsSync(npmrc)) {
        const curContents = fs.readFileSync(npmrc, 'utf8')
        curContents.split(os.EOL).forEach((line) => {
            // Add current contents unless they are setting the registry
            if (!line.toLowerCase().startsWith('registry')) {
                newContents += line + os.EOL
            }
        })
    }
    const registryString = scope ? `${scope}:registry=${registryUrl}` : `registry=${registryUrl}`
    // Remove http: or https: from front of registry.
    const authString =
        registryUrl.replace(/(^\w+:|^)/, '') + `:_authToken=${installationAccessToken}`
    newContents += `${authString}${os.EOL}${registryString}`
    core.info(`Debug: ${newContents}`)
    fs.writeFileSync(npmrc, newContents)
    core.exportVariable('NPM_CONFIG_USERCONFIG', npmrc)
    // Export empty node_auth_token so npm doesn't complain about not being able to find it
    core.exportVariable('NODE_AUTH_TOKEN', 'XXXXX-XXXXX-XXXXX-XXXXX')
}

run()
