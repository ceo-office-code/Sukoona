# Public website archived — 13 September 2026

## Restored — 13 September 2026

At the owner's request, the previous informational website was restored from the verified snapshot below: 24 public page, layout, stylesheet and asset files matched their archived SHA256 checksums. The original homepage, scroll animation, images, journal, contact page, privacy notice, metadata and sitemap are restored. The temporary blank page and blank stylesheet were removed.

The blank version was saved before restoration to `W:\Wellness Brand\sukoona-backups\20260913-101918-blank-checkpoint`. Admin/API implementations and database contents were preserved. `.vercelignore` still excludes local environment files from uploads. Payment checkout remains disabled.

## Previous archive operation

The owner requested a completely blank public website and a separate backup for later restoration.

Verified local backup: `W:\Wellness Brand\sukoona-backups\20260913-084722-public-22iAe\project`.
Its parent folder contains `manifest.json` (SHA256 checksums for 74 files) and `RESTORE.md`.
The snapshot includes the working source and product images, but excludes secret environment files, dependencies, build caches, Git internals and database records.

The homepage and missing-page view are blank. Blog, contact and privacy pages, the favicon, and public image assets have been removed. Product metadata and sitemap entries were removed, and indexing is disabled. Admin authentication, management APIs, credentials and database contents are preserved.

To restore, first back up the then-current project. Review and restore the saved public pages, root layout, admin layout stylesheet imports, metadata routes, favicon and public assets. Preserve any later admin/API fixes. Run lint/build, inspect the result, and deploy only within the owner's requested scope.

Payment checkout was not enabled before this archive and remains disabled. Archiving or restoring the public content does not activate payment processing.
