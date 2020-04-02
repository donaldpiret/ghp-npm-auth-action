# GitHub Packages NPM Auth Action

This action allows a GitHub Actions workflow to set up NPM authentication using a GitHub App.
It will use the GitHub App to generate a temporary access token that gives package read access to 

## Inputs

### `app-id`

**Required** The GitHub App ID of the app used to authenticate against the GitHub Package Registry. This should be an application you have registered yourself and that has read-only access to the content of the repositories in which you will be storing GitHub packages.

### `pem-private-key`

**Required** The PEM-formatted private key of the application. 

## Example usage
