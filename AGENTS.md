<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Business/promo image fields store either a public path/URL or `storage:<path>` for the private photo bucket; resolve via `resolveImages` in src/lib/data.ts (signed URLs) — workspace blocks public buckets.
- Public pages read businesses/promotions with the browser Supabase client through react-query options in src/lib/data.ts; admin UI lives in src/components/admin/* and relies on RLS for authorization.
- Shared marketplace presentation state lives in a root provider; browser-only saved favorites use localStorage after hydration so discovery controls work across pages without changing backend business data.
- Reuse shared Header, OpenBadge, CTAs and Button across marketplace pages; use global semantic design tokens so visual upgrades remain consistent without replacing business logic.
- Keep botanical header imagery and reference-inspired category styling in the shared visual system; category selection remains in the existing feed so presentation changes do not alter business queries.
- Ratings and sponsorship must never be inferred or fabricated; show unrated states until genuine review or sponsorship data exists.
