/**
 * LOGIC: AudioManager
 * - Central place for all sound in the game (SFX + music).
 * - Uses <audio> elements for file sounds (jump/coin/death/music).
 * - Uses WebAudio only for the tiny “beep” synth sounds.
 */
export class AudioManager {
  constructor({ ASSETS, muteBtn }) {
    // ---------- DEATH SOUND ----------
    this.deathSound = new Audio(ASSETS.deathWav);
    this.deathSound.volume = 0.7;

    // ---------- JUMP SOUND ----------
    this.jumpSound = new Audio(ASSETS.jumpWav);
    this.jumpSound.volume = 0.6;

    // ---------- COIN COLLECT SOUND ----------
    this.coinSound = new Audio(ASSETS.coinWav);
    this.coinSound.volume = 0.6;

    // ---------- BACKGROUND MUSIC ----------
    this.bgMusic = new Audio(ASSETS.bgMusicWav);
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.4;

    // ---------- SOUND (WebAudio, no external files) ----------
    this.audio = { ctx: null, master: null, muted: false, vol: 0.6 };

    this.muteBtn = muteBtn;
  }
  /**
   * LOGIC: ensureAudio()
   * - Creates the WebAudio AudioContext the first time we need it.
   * - Also creates one “master” GainNode so muting/volume is one knob.
   * - Doing it lazily avoids browser autoplay restrictions until user interacts.
   */


  ensureAudio() {
    if (this.audio.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.audio.ctx = new AC();
    this.audio.master = this.audio.ctx.createGain();
    this.audio.master.gain.value = this.audio.muted ? 0 : this.audio.vol;
    this.audio.master.connect(this.audio.ctx.destination);
  }
  /**
   * LOGIC: setVolume(v)
   * - Saves the new volume value (0.0–1.0).
   * - Updates WebAudio master gain (for beep sounds).
   * - Also scales the HTMLAudio element volumes (music/jump/coin/death)
   *   so one slider controls everything.
   */


  setVolume(v) {
    this.audio.vol = v;
    if (this.audio.master) this.audio.master.gain.value = this.audio.muted ? 0 : this.audio.vol;

    const gain = this.audio.muted ? 0 : this.audio.vol;
    this.bgMusic.volume = 0.4 * gain;
    this.coinSound.volume = 0.6 * gain;
    this.jumpSound.volume = 0.6 * gain;
    this.deathSound.volume = 0.7 * gain;
  }
  /**
   * LOGIC: setMuted(m)
   * - Sets muted flag.
   * - If muted: master gain = 0 and all HTMLAudio volumes become 0.
   * - If unmuted: restore master gain and file volumes based on current volume.
   * - Updates the mute button text so the UI matches the state.
   */


  setMuted(m) {
    this.audio.muted = m;
    if (this.audio.master) this.audio.master.gain.value = this.audio.muted ? 0 : this.audio.vol;

    const gain = this.audio.muted ? 0 : this.audio.vol;
    this.bgMusic.volume = 0.4 * gain;
    this.coinSound.volume = 0.6 * gain;
    this.jumpSound.volume = 0.6 * gain;
    this.deathSound.volume = 0.7 * gain;

    if (this.muteBtn) this.muteBtn.textContent = this.audio.muted ? "Unmute" : "Mute";
  }
  /**
   * LOGIC: beep(type)
   * - Plays a short synthesized beep using WebAudio (no file needed).
   * - Chooses frequency + waveform + duration depending on “type”.
   * - Uses a Gain envelope (quick fade in/out) so it doesn’t click.
   */


  beep(type) {
    this.ensureAudio();
    if (this.audio.ctx.state === "suspended") this.audio.ctx.resume();

    const t0 = this.audio.ctx.currentTime;
    const osc = this.audio.ctx.createOscillator();
    const g = this.audio.ctx.createGain();

    let freq = 440, dur = 0.10;
    let wave = "square";

    if (type === "jump") { freq = 520; dur = 0.08; wave = "square"; }
    if (type === "coin") { freq = 880; dur = 0.07; wave = "triangle"; }
    if (type === "hit")  { freq = 160; dur = 0.14; wave = "sawtooth"; }
    if (type === "start"){ freq = 620; dur = 0.06; wave = "triangle"; }

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t0);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(this.audio.master);

    osc.start(t0);
    osc.stop(t0 + dur);
  }
  /**
   * LOGIC: playDeath()
   * - Rewinds the death sound to start (currentTime = 0) and plays it.
   * - catch() prevents console errors if autoplay is blocked.
   */


  playDeath() {
    this.deathSound.currentTime = 0;
    this.deathSound.play().catch(()=>{});
  }
  /**
   * LOGIC: playJump()
   * - Rewinds and plays jump sound immediately.
   */

  playJump() {
    this.jumpSound.currentTime = 0;
    this.jumpSound.play().catch(()=>{});
  }
  /**
   * LOGIC: playCoin()
   * - Rewinds and plays coin collect sound immediately.
   */

  playCoin() {
    this.coinSound.currentTime = 0;
    this.coinSound.play().catch(()=>{});
  }
}
