# Wilted
[WILT](http://wilt.fm) scrobbler for Google Play Music Desktop Player

Many thanks to [ModalSeoul](http://github.com/modalseoul) for his Chrome Scrobbler, which much of the scrobbling of this is built based off.

## Using

These instructions require that [NodeJS](https://nodejs.org) is installed on your computer, and added to the path. They also assume that you've already downloaded Wilted and extracted it to a folder (if downloaded as a .zip -- extraction not needed if cloned).

1. Ensure GPMDP is loaded *before* Wilted
2. Go to the Wilted download location
3. Run `npm install` to install required dependencies
4. Run `npm start` to run Wilted.

## Manual forced scrobbles

Wilted attempts to estimate when it should next check your tracks, based on how long is left of the currently playing track when it last scrobbled. However, this system doesn't work too well when users skip tracks, as if the track that's been skipped to is shorter than the length of the last one, it usually wouldn't get scrobbled in time.

To address this, when you're running Wilted, if you need to trigger a scrobble check, hit enter. Standard double-scrobble checking mechanisms still apply to manual scrobble checks, however, and you should be warned that **cheating the scrobbles to weigh in your favour on the Wilt.fm leaderboard will remove you from contributing to global stats -- [see ModalSeoul's official stance on this here](https://github.com/ModalSeoul/Weeb.FM/issues/36).

It's also worth noting that manual scrobbles should be avoided wherever possible, as they will add extra continuous checks later on. This, in turn, increases (albeit unlikely) chances of a double-scrobble, or using a bit more resources than usual. Other than that, this feature should be relatively safe.
