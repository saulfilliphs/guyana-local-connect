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
