# শুনে শিখি — weekly audio publishing

> Update: the Supabase Creator Desk is now implemented in this branch. Use
> `/admin.html` after owner invitation and approved deployment. See
> `ADMIN-SETUP.md` for current setup/status. The catalog workflow below is the
> older optional manual route; the public page now also reads published Supabase
> episodes. Local file preview still never uploads.

## What exists now
- `/listen.html`: Bengali-first weekly audio library, topic/search filters, one native audio player, speed and 15-second skip controls, browser-local resume for published episodes, source links and optional transcript.
- Home-page promotional section and mobile Listen navigation.
- Private local file preview (150 MB maximum). **It does not upload or publish.** A browser-selected file disappears after reload and cannot be heard by classmates.
- Catalog `assets/audio-episodes.js` is intentionally empty. No recordings, invented release dates, fabricated reviews, or example episodes are presented as published content.
- No public/admin upload API, authentication service or storage account has been configured. An authenticated publishing dashboard is a separate future feature. Do not put storage credentials in browser code.
- No autoplay, automatic NotebookLM integration, background downloading, or advertising scripts on the listening page. Audio availability and background/lock-screen playback depend on the browser and host.

## Weekly workflow
1. Prepare original notes from reliable current-affairs sources. Prefer original summaries, public-domain/licensed sources or material you have permission to adapt. Buying a book alone does not confer permission to distribute an audio adaptation. Link to the original book/publisher rather than uploading its PDF or full text.
2. Use NotebookLM or your chosen tool to create audio. Export MP3/M4A (MP3 is a useful compatibility choice). We do not generate or upload to NotebookLM from this site.
3. Listen through the whole recording. Check dates, names, numbers, quotations and news context against sources. Remove errors and identify the covered week. Keep a written transcript or notes if possible. AI may mispronounce Bengali names or misstate facts.
4. Test the file using the page's **private preview**. This is not a public release.
5. Upload the audio to owner-controlled HTTPS object storage/CDN configured for public audio delivery. Use an enduring direct media URL, not a login page, expiring signed link or file-sharing viewer. Hosting may have bandwidth/storage costs. Check content type (e.g. `audio/mpeg` for MP3), browser playback and byte-range support for seeking. Use a new URL when replacing a recording so stale audio is not mistaken for the correction.
6. Add one reviewed record to `assets/audio-episodes.js` (format below). Keep stable, unique IDs; resume position is stored under that ID. On a substantially revised recording, give it a new ID to avoid resuming at a misleading point.
7. Run `npm test && npm run build && npm run test:deployment`. Check the page on a phone using the real hosted URL. Unit tests do not verify external audio delivery.
8. **Request owner approval before PR/push/deploy.** After production deploy, verify play, pause, seek, speed, source links and corrections contact. Share `/listen.html` with classmates.

## Catalog format (documentation only; replace sample values)
```js
window.POCKET_AUDIO_EPISODES = [
  {
    id: 'current-affairs-2026-11-week-1',
    title: 'Your reviewed episode title',
    summary: 'A short, accurate description of the topics actually discussed.',
    topic: 'বাংলাদেশ',
    weekStart: '2026-11-01',
    weekEnd: '2026-11-07',
    published: '2026-11-08',
    audioUrl: 'https://YOUR-AUDIO-HOST/your-recording.mp3',
    reviewed: true,
    reviewedBy: 'Actual reviewer name',
    rightsConfirmed: true,
    sources: [
      { title: 'Original report or authorized source', url: 'https://YOUR-SOURCE/article' }
    ],
    transcript: 'Optional reviewed transcript or extended reading notes.'
  }
];
```
Use the real dates, reviewer, source and media URL—not the placeholder text. `reviewed` and `rightsConfirmed` are publisher declarations, **not automated factual/copyright verification**. The UI excludes malformed, duplicate or incomplete records. It does not verify that a source supports the claims or that a remote URL is playable. Raw catalog content is public, so do not keep confidential drafts in it.

## Privacy and accessibility
- Published audio is requested when its player is opened/used; the audio host can receive IP/request metadata. No tracking provider is added by this feature.
- Local file preview uses a device-local blob URL; no file contents are sent to the server.
- Listening position is saved locally for published episodes. Browser storage restrictions can disable resume without preventing playback.
- Use a transcript for readers who cannot hear the audio. Native audio controls remain available; there is no forced autoplay.
- This is a reading companion, not a replacement for books or a guarantee of exam readiness. The Bengali note on the page preserves this intent.
