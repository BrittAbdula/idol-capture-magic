interface GoogleRedirectUriOptions {
  configuredRedirectUri: string;
  publicAppOrigin: string;
  requestUrl?: string;
}

export function resolveGoogleRedirectUri({
  configuredRedirectUri,
  publicAppOrigin,
  requestUrl
}: GoogleRedirectUriOptions): string {
  if (!requestUrl) {
    return configuredRedirectUri;
  }

  const requestOrigin = new URL(requestUrl).origin;
  const configured = new URL(configuredRedirectUri);
  const publicApp = new URL(publicAppOrigin);

  if (isAppOrigin(configured, publicApp)) {
    return new URL("/auth/google/callback", requestOrigin).toString();
  }

  return configuredRedirectUri;
}

function isAppOrigin(configured: URL, publicApp: URL): boolean {
  return (
    configured.protocol === publicApp.protocol &&
    stripWww(configured.hostname) === stripWww(publicApp.hostname)
  );
}

function stripWww(hostname: string): string {
  return hostname.replace(/^www\./i, "");
}
