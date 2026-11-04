/**
 * High-precision Audio Synchronization Engine
 * Handles clock drift, NTP-like network latency calculation, and smooth pitch-preserved catch-up.
 */

export interface SyncEngineConfig {
  softCatchupThresholdSec: number; // e.g. 0.15s
  hardSeekThresholdSec: number;    // e.g. 0.8s
  minDriftToleranceSec: number;    // e.g. 0.08s
}

export const DEFAULT_SYNC_CONFIG: SyncEngineConfig = {
  softCatchupThresholdSec: 0.15,
  hardSeekThresholdSec: 0.8,
  minDriftToleranceSec: 0.08,
};

export class SyncEngine {
  private config: SyncEngineConfig;
  private clockOffset: number = 0; // offset between local clock and host clock
  private rttSamples: number[] = [];
  private currentLatencyMs: number = 20;

  constructor(config: Partial<SyncEngineConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
  }

  /**
   * Record a round-trip ping-pong to update latency and clock offset
   */
  public recordPingPong(clientSendTime: number, hostTime: number, clientRecvTime: number) {
    const rtt = Math.max(0, clientRecvTime - clientSendTime);
    this.rttSamples.push(rtt);
    if (this.rttSamples.length > 10) this.rttSamples.shift();

    // Average RTT
    const avgRtt = this.rttSamples.reduce((a, b) => a + b, 0) / this.rttSamples.length;
    this.currentLatencyMs = Math.round(avgRtt / 2);

    // Clock offset = ( (hostTime - clientSendTime) + (hostTime - clientRecvTime) ) / 2
    this.clockOffset = hostTime - (clientSendTime + clientRecvTime) / 2;
  }

  public getLatency(): number {
    return this.currentLatencyMs;
  }

  /**
   * Calculate expected playback position in seconds based on host state
   */
  public calculateExpectedTime(
    hostPosition: number,
    isPlaying: boolean,
    hostUpdatedAt: number,
    playbackRate: number = 1.0
  ): number {
    if (!isPlaying) {
      return hostPosition;
    }

    const localNow = Date.now();
    const adjustedHostNow = localNow + this.clockOffset;
    const elapsedSeconds = Math.max(0, (adjustedHostNow - hostUpdatedAt) / 1000);

    return hostPosition + elapsedSeconds * playbackRate;
  }

  /**
   * Reconcile HTML Audio Element with expected time
   * Returns: { action: 'none' | 'rate-adjust' | 'hard-seek', drift: number, targetRate?: number }
   */
  public reconcile(
    audio: HTMLAudioElement,
    expectedTime: number,
    isPlaying: boolean
  ): {
    action: 'none' | 'rate-adjust' | 'hard-seek';
    driftSec: number;
    targetRate: number;
  } {
    if (!audio) return { action: 'none', driftSec: 0, targetRate: 1.0 };

    // If play state doesn't match
    if (isPlaying && audio.paused) {
      audio.play().catch(() => {
        // Autoplay policy fallback
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }

    const current = audio.currentTime;
    const driftSec = current - expectedTime; // positive means client is ahead, negative means behind
    const absDrift = Math.abs(driftSec);

    // If within acceptable tolerance, keep normal playback
    if (absDrift <= this.config.minDriftToleranceSec) {
      if (audio.playbackRate !== 1.0) audio.playbackRate = 1.0;
      return { action: 'none', driftSec, targetRate: 1.0 };
    }

    // Hard seek if drift is large (e.g. user scrubbed or network stall)
    if (absDrift >= this.config.hardSeekThresholdSec) {
      audio.currentTime = Math.max(0, expectedTime);
      audio.playbackRate = 1.0;
      return { action: 'hard-seek', driftSec, targetRate: 1.0 };
    }

    // Soft catch-up: slightly increase or decrease speed so sound doesn't skip
    if (absDrift >= this.config.softCatchupThresholdSec) {
      let targetRate = 1.0;
      if (driftSec < 0) {
        // Client is behind, speed up slightly
        targetRate = Math.min(1.08, 1.0 + absDrift * 0.1);
      } else {
        // Client is ahead, slow down slightly
        targetRate = Math.max(0.92, 1.0 - absDrift * 0.1);
      }
      audio.playbackRate = targetRate;
      return { action: 'rate-adjust', driftSec, targetRate };
    }

    return { action: 'none', driftSec, targetRate: 1.0 };
  }
}
