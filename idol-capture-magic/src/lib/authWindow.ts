interface GoogleSignInOpener {
  open(url: string, target: string, features: string): WindowProxy | null;
}

export function openGoogleSignInTab(authUrl: string, opener: GoogleSignInOpener = window): boolean {
  return Boolean(opener.open(authUrl, "_blank", "noopener,noreferrer"));
}
