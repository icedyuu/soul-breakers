# Re-encodes the chosen CC0 source files into game/audio/ (ogg + mp3, small bitrates).
#   python3 tools/make_audio.py <dir with extracted packs>
# Expected layout of <dir>: impact/ interface-sounds/ rpg-audio/ sci-fi-sounds/ voiceover-pack-fighter/ music/
# Sources + licenses: audio/CREDITS.txt. Needs ffmpeg (libvorbis, libmp3lame).
import glob, os, subprocess, sys
src = os.path.abspath(sys.argv[1]); here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(here, "audio")
def find(name):
    m = glob.glob(os.path.join(src, "**", name + ".ogg"), recursive=True) + glob.glob(os.path.join(src, "**", name + ".mp3"), recursive=True)
    if not m: sys.exit("missing " + name)
    return m[0]
SFX = {}
for i in range(3):
    SFX[f"punch_m{i+1}"] = f"impactPunch_medium_00{i}"; SFX[f"punch_h{i+1}"] = f"impactPunch_heavy_00{i}"
    SFX[f"plate{i+1}"] = f"impactPlate_light_00{i}"; SFX[f"step{i+1}"] = f"footstep_concrete_00{i}"
for i in range(2):
    SFX[f"soft_m{i+1}"] = f"impactSoft_medium_00{i}"; SFX[f"soft_h{i+1}"] = f"impactSoft_heavy_00{i}"
    SFX[f"metal_h{i+1}"] = f"impactMetal_heavy_00{i}"; SFX[f"wood_l{i+1}"] = f"impactWood_light_00{i}"
    SFX[f"mining{i+1}"] = f"impactMining_00{i}"; SFX[f"expl{i+1}"] = f"explosionCrunch_00{i}"
    SFX[f"laser{i+1}"] = f"laserLarge_00{i}"; SFX[f"ui_move{i+1}"] = f"select_00{i+1}"
SFX.update({"bell1": "impactBell_heavy_000", "slice1": "knifeSlice", "slice2": "knifeSlice2", "draw1": "drawKnife1", "draw2": "drawKnife2",
            "cloth1": "cloth1", "cloth2": "cloth2", "lowboom1": "lowFrequency_explosion_000", "ui_ok1": "confirmation_001", "ui_back1": "back_001"})
VOICE = {f"round{i}": f"round_{i}" for i in range(1, 6)}
VOICE.update({"final": "final_round", "fight": "fight", "time": "time"})
MUSIC = {"menu": "menu_determination_anime", "neon": "stage_neon_city_neon_hyperdrive", "volcano": "stage_volcano_fire_level",
         "bamboo": "stage_bamboo_hot_springs_town", "results": "results_ending_juhani_junkala"}
def enc(inp, dst, music):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    af = ["-af", "loudnorm=I=-16:TP=-1.5"] if music else ["-af", "silenceremove=start_periods=1:start_threshold=-60dB"]
    ch = ["-ac", "2", "-ar", "44100"] if music else ["-ac", "1", "-ar", "44100"]
    for ext, codec in (("ogg", ["-c:a", "libvorbis", "-q:a", "2" if music else "3"]), ("mp3", ["-c:a", "libmp3lame", "-b:a", "96k" if music else "80k"])):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", inp, *af, *ch, *codec, "-map_metadata", "-1", dst + "." + ext], check=True)
for k, v in SFX.items(): enc(find(v), os.path.join(out, "sfx", k), False)
for k, v in VOICE.items(): enc(find(v), os.path.join(out, "voice", k), False)
for k, v in MUSIC.items(): enc(glob.glob(os.path.join(src, "music", "*" + v + ".*"))[0], os.path.join(out, "music", k), True)
print("audio ->", out)
