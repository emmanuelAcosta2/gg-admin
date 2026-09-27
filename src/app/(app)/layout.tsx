import { Brand } from "@/components/brand";
import { Nav } from "@/components/nav";
import { signOut } from "@/app/login/actions";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();

  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      <aside className="hidden w-[264px] flex-none flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 pt-[22px] pb-4">
          <Brand stacked />
        </div>
        <div className="flag" aria-hidden="true" />
        <Nav variant="side" />
        <div className="mt-auto flex flex-col gap-2 border-t border-line p-4 text-[13px] text-muted">
          {user ? (
            <>
              <span className="truncate">{user.email}</span>
              <form action={signOut}>
                <button className="font-semibold text-fg underline-offset-4 hover:underline">Salir</button>
              </form>
            </>
          ) : (
            <span>Modo diseño: Supabase sin configurar.</span>
          )}
        </div>
      </aside>

      <header className="bg-canvas px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2.5 lg:hidden">
        <Brand />
      </header>
      <div className="flag lg:hidden" aria-hidden="true" />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 pt-4 pb-24 lg:px-10 lg:pt-8 lg:pb-12">
          {!isSupabaseConfigured && (
            <p className="rounded-lg border border-dashed border-line px-3 py-2 text-[12px] text-muted lg:hidden">
              Modo diseño: Supabase sin configurar.
            </p>
          )}
          {children}
        </div>
      </main>

      <div className="lg:hidden">
        <Nav variant="bottom" />
      </div>
    </div>
  );
}
