# Knowledge RPG

**Website:** https://metur100.github.io/islam-apps/en/knowledge-rpg/ · **Privacy policy:** https://metur100.github.io/islam-apps/en/knowledge-rpg/privacy/

An Islamic learning RPG in which the hero grows only through real learning: lessons, practice, tests, review and challenges. Knowledge is the hero's strength.

- Free: no ads, no purchases, no subscriptions, no pay-to-win, no accounts
- Fully offline, no network access at all
- Bosnian, German and English
- Built with Expo (React Native) + TypeScript

## The world

Eight areas on an illustrated world map, unlocked one after another (two units of the previous area open the next):

Salah Valley · Quran Library · Seerah City · Prophet Mountains · Akhlaq Garden · Ramadan Desert · History Kingdom · Arabic Academy

Each area has three learning units and a **Master Challenge**.

## Learning loop

```
LEARN → PRACTICE (not scored) → TEST → EXPLANATION → REWARD
```

- **Learn**: short lesson sections with sources, Arabic with transliteration and pronunciation, and a note where scholars hold different valid views.
- **Practice**: one easy interaction before the test.
- **Test**: scored questions. A wrong answer shows "Not quite", the correct answer and an explanation, and goes into spaced review.
- **Master Challenge**: 10 questions from the whole area (weak questions first), 70 % to pass. A fail shows the units to review and offers review and retry — it is a knowledge challenge, never a fight.

### Question types

Multiple choice, true/false, matching, ordering, memory, image selection, scenario ("What would you do?"), fill in the blank and categorization.

## Progress

- **XP & levels** (100 XP for level 2, +50 per level). XP for a question is earned once; repeating content helps memory but cannot farm XP.
- **Knowledge stats** per area (0–100 %): the share of the area's test questions answered correctly and not currently pending review — shown as a radar chart and bars. It measures learned content, never faith.
- **Quests**: daily, learning, knowledge, review and challenge quests — at most five a day, no timers.
- **Spaced review** (Leitner boxes 0/1/3/7/14 days) with `lastSeen`, `correctCount`, `incorrectCount`, `nextReviewDate`.
- **Learning streak** counted only for meaningful learning.
- **Achievements**: First Lesson, First Perfect Quiz, 7/30-Day Learner, Salah Scholar, Quran Explorer, Seerah Explorer, Akhlaq Champion, Arabic Beginner, Knowledge Seeker, Knowledge Master.
- **Daily challenge** rotating between question, scenario, mini game, memory and review.

## Religious accuracy

- Content lives in `src/content/<area>/<unit>.json`, separate from code, with surah:ayah and hadith-collection references for every unit.
- No invented verses, hadith, stories or rulings; where schools differ the unit says so. The app is educational and gives no fatwas.
- Prophets are never depicted; illustrations show only landscapes, architecture and objects.

## Accessibility & audio

Large text, high contrast, reduced motion, screen-reader labels, large touch targets. Optional audio: UI sounds, Arabic pronunciation and lesson narration via the device's offline text-to-speech (`src/services/speech.ts` defines a `NarrationProvider` that can later be swapped for recorded human narration).

## Structure

```
src/
  app/          Expo Router: (tabs)/index, map, quests, profile · area/[id] · unit/[id] · master/[id] · review · daily · settings · character · onboarding · info/[page]
  components/   ui/, questions/ (all question types), steps/LessonView, rpg/ (WorldMap, KnowledgeRadar, QuestCard), scene/, character/, game/
  content/      areas.json, <area>/<unit>.json, typed loader
  models/       Area, Unit, Question, GameState, Quest, …
  services/     quiz, progression, quests, badges, review, streak, xp, daily, gameEngine, speech, sound
  storage/      AsyncStorage persistence with migration
  store/        Zustand store with debounced autosave
  localization/ en / de / bs
```

## Scripts

```bash
npm install
npm start               # dev server
npm run android         # development build on device/emulator
npm run verify          # typecheck + lint + tests
npm run generate:icons  # re-render icons (shield + eight-pointed star)
```

Android release build:

```bash
npx expo prebuild --platform android
cd android && ./gradlew bundleRelease assembleRelease
# → android/app/build/outputs/bundle/release/app-release.aab  (Google Play)
# → android/app/build/outputs/apk/release/app-release.apk  (direct install)
```

Release builds are signed with the upload key configured in `~/.gradle/gradle.properties` (see `plugins/withReleaseSigning.js`):

```properties
KNOWLEDGE_RPG_UPLOAD_STORE_FILE=C:/path/to/keystore
KNOWLEDGE_RPG_UPLOAD_STORE_PASSWORD=…
KNOWLEDGE_RPG_UPLOAD_KEY_ALIAS=…
KNOWLEDGE_RPG_UPLOAD_KEY_PASSWORD=…
```

Without these properties the build falls back to the debug key (fine for testing). The keystore and passwords are never committed.

`plugins/withStableAndroidBuild.js` makes local Gradle builds reliable on Windows (in-process Kotlin compilation, short CMake paths).

## Privacy

No data leaves the device; progress can be deleted in Settings → Reset progress.
