"use client";

type AudioStateCallback = (isMuted: boolean) => void;

class GlobalAudioEngine {
  private isMuted = false;
  private registeredVideos: Set<HTMLVideoElement> = new Set();
  private subscribers: Set<AudioStateCallback> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.attachGlobalUnlockListeners();
    }
  }

  private attachGlobalUnlockListeners() {
    if (typeof window === "undefined") return;

    const unlock = () => {
      this.isMuted = false;
      this.syncVideos();
    };

    const events = ["pointerdown", "click", "touchstart", "keydown"];
    events.forEach((evt) => {
      window.addEventListener(evt, unlock, { passive: true });
    });
  }

  public async forceUnlockAndPlayAll(): Promise<boolean> {
    this.isMuted = false;
    this.syncVideos();
    this.notifySubscribers();
    return true;
  }

  public subscribe(cb: AudioStateCallback): () => void {
    this.subscribers.add(cb);
    cb(this.isMuted);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach((cb) => cb(this.isMuted));
  }

  public registerVideoElement(video: HTMLVideoElement): () => void {
    if (!video) return () => {};
    this.registeredVideos.add(video);
    this.syncVideo(video);

    return () => {
      this.registeredVideos.delete(video);
    };
  }

  public syncVideos() {
    this.registeredVideos.forEach((video) => this.syncVideo(video));
  }

  private syncVideo(video: HTMLVideoElement) {
    if (!video) return;
    video.muted = false;
    video.volume = 1.0;

    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }

  public isAudioEnabled(): boolean {
    return !this.isMuted;
  }

  public setAudioEnabled(enabled: boolean): boolean {
    return this.setMuted(!enabled);
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;

    if (this.isMuted) {
      this.registeredVideos.forEach((v) => {
        v.muted = true;
      });
    } else {
      this.syncVideos();
    }

    this.notifySubscribers();
    return this.isMuted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playClick() {}
}

export const audioEngine = new GlobalAudioEngine();
