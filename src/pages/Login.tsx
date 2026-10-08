import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams, Link } from "react-router";
import Logo from "@/components/Logo";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const [params] = useSearchParams();
  const next = params.get("next");

  return (
    <div className="brand-grid-bg flex min-h-screen items-center justify-center bg-paper px-4">
      <Card className="w-full max-w-sm rounded-none border-[color:var(--line-strong)] bg-panel shadow-[0_24px_60px_rgba(8,45,79,0.14)]">
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="font-display text-2xl">Save your brand system</CardTitle>
          <p className="pt-2 text-[13px] leading-relaxed text-ink-soft">
            One sign-in keeps your system versioned, locked and exportable. We never
            ask for an account before you've seen the product.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            className="btn-clip w-full rounded-none bg-ink text-[14px] font-semibold tracking-wide text-paper"
            size="lg"
            onClick={() => {
              if (next) sessionStorage.setItem("bk360_next", next);
              window.location.href = getOAuthUrl();
            }}
          >
            <span className="btn-mask bg-brand-accent" aria-hidden />
            Sign in with Kimi
          </Button>
          <p className="mt-4 text-center">
            <Link to="/" className="text-[12px] text-ink-faint underline-offset-4 hover:text-brand-accent hover:underline">
              ← Back to the site
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
