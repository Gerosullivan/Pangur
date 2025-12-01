import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../state/gameStore";
import track01 from "../../assets/music/01_I-and-Pangur-Ban-my-cat.mp3";
import track02 from "../../assets/music/02_Pangur-and-I-instrumental.mp3";
import track03 from "../../assets/music/03_Brehon-Timedance.mp3";
import track04 from "../../assets/music/04_Barn-walls-humming-in-the-lantern-light.mp3";
import track05 from "../../assets/music/05_In-the-dim-bones-of-the-barn-we-rise.mp3";
import track06 from "../../assets/music/06_In-the-dim-bones-of-the-barn-v2.mp3";

type MusicTrack = {
  src: string;
  label: string;
};

const TRACKS: MusicTrack[] = [
  { src: track01, label: "I and Pangur Bán (my cat)" },
  { src: track02, label: "Pangur and I (instrumental)" },
  { src: track03, label: "Brehon Timedance" },
  { src: track04, label: "Barn walls humming in the lantern light" },
  { src: track05, label: "In the dim bones of the barn we rise" },
  { src: track06, label: "In the dim bones of the barn v2" },
];

export function useMusicPlayer() {
  const settings = useGameStore((state) => state.settings);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialVolume = useRef(settings.musicVolume);
  const initialMuted = useRef(settings.muted);

  useEffect(() => {
    const audio = new Audio(TRACKS[0].src);
    audio.loop = false;
    audio.muted = initialMuted.current;
    audio.volume = initialMuted.current ? 0 : initialVolume.current;

    const handleEnded = () => {
      setTrackIndex((prev) => (prev + 1) % TRACKS.length);
    };

    audio.addEventListener("ended", handleEnded);
    audioRef.current = audio;

    const startPlayback = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
        setAutoplayBlocked(false);
      } catch (err) {
        setIsPlaying(false);
        setAutoplayBlocked(true);
      }
    };

    startPlayback();

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!autoplayBlocked) return;
    const handleUserStart = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => setAutoplayBlocked(true));
    };
    window.addEventListener("pointerdown", handleUserStart, { once: true });
    return () => window.removeEventListener("pointerdown", handleUserStart);
  }, [autoplayBlocked]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = settings.muted;
    audio.volume = settings.muted ? 0 : settings.musicVolume;
  }, [settings.muted, settings.musicVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = TRACKS[trackIndex].src;
    audio.currentTime = 0;
    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
        setAutoplayBlocked(true);
      });
    }
  }, [trackIndex, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setAutoplayBlocked(true);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    updateSettings({ muted: !settings.muted });
  };

  const skipTrack = () => {
    setTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const setVolume = (value: number) => {
    const nextVolume = Math.min(Math.max(value, 0), 1);
    const nextSettings: Partial<typeof settings> = { musicVolume: nextVolume };
    if (settings.muted && nextVolume > 0) {
      nextSettings.muted = false;
    }
    updateSettings(nextSettings);
  };

  const currentTrack = useMemo(() => {
    return TRACKS[trackIndex] ?? TRACKS[0];
  }, [trackIndex]);

  return {
    currentTrack,
    isPlaying,
    isMuted: settings.muted,
    volume: settings.musicVolume,
    autoplayBlocked,
    trackIndex,
    totalTracks: TRACKS.length,
    togglePlay,
    toggleMute,
    skipTrack,
    setVolume,
  };
}
