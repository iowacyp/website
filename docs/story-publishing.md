# Story publishing workflow

`src/data/storyGallery.json` is the shared source for event stories.

## Add or update a story

1. Add or edit the story in `storyGallery.json`. Keep newest stories first.
2. Store its optimized full and thumbnail images in `src/assets/img/story-gallery/`.
3. Add `"audiences": ["stp"]` when the story includes State Teen Panel or Guard Teen Panel leadership. It will then appear automatically on the State Teen Panel page.
4. Run `npm run build:prod` before publishing.
5. Commit and deploy the source and generated `dist/` changes together.

The public Stories collection, individual story pages, kiosk grid, slideshow, expanded kiosk story, and STP story cards are generated from this data. The kiosk service worker cache key is generated from the story text and image files, so a deployed story or photo update automatically creates a fresh offline cache.
