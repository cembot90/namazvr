# Mitgelieferte Bibliotheken

| Ordner | Projekt | Lizenz | Quelle |
| --- | --- | --- | --- |
| `vendor/ort/` | ONNX Runtime Web 1.18.0 (Microsoft) | MIT | https://github.com/microsoft/onnxruntime |
| `vendor/piper/piper_phonemize.wasm`, `.data` | piper-wasm 1.0.0 (Diffusion Studio) – Build von piper-phonemize mit espeak-ng | MIT (Build), espeak-ng: GPL-3.0-or-later | https://github.com/diffusion-studio/piper-wasm · https://github.com/rhasspy/piper-phonemize · https://github.com/espeak-ng/espeak-ng |
| `vendor/piper/piper_phonemize.mjs` | Lade-Code aus @mintplex-labs/piper-tts-web 1.0.5 | MIT | https://github.com/Mintplex-Labs/piper-tts-web |

| `vendor/hdri/` | Lichtumgebungen (HDRI) von Poly Haven, über @pmndrs/assets 1.7.0 | CC0 1.0 | https://polyhaven.com · https://github.com/pmndrs/assets |

Die Stimmen selbst (Piper-Modelle) werden nicht mitgeliefert: Die App lädt sie auf Wunsch direkt von
https://huggingface.co/rhasspy/piper-voices auf das Gerät. Lizenz je Stimme siehe die MODEL_CARD im jeweiligen Ordner
(Deutsch „Thorsten“: CC0 1.0).
