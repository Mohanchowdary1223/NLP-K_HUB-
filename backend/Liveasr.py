import pyaudio
import wave
import speech_recognition as sr
from googletrans import Translator

def record_audio(filename, duration, rate=44100, channels=1, chunk=1024):
    p = pyaudio.PyAudio()

    stream = p.open(format=pyaudio.paInt16,
                    channels=channels,
                    rate=rate,
                    input=True,
                    frames_per_buffer=chunk)

    frames = []

    print("Recording...")
    for _ in range(0, int(rate / chunk * duration)):
        data = stream.read(chunk)
        frames.append(data)
    print("Finished recording.")

    stream.stop_stream()
    stream.close()
    p.terminate()

    wf = wave.open(filename, 'wb')
    wf.setnchannels(channels)
    wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
    wf.setframerate(rate)
    wf.writeframes(b''.join(frames))
    wf.close()

def transcribe_audio(filename):
    recognizer = sr.Recognizer()
    audio_file = sr.AudioFile(filename)
    
    with audio_file as source:
        audio_data = recognizer.record(source)
    
    try:
        text = recognizer.recognize_google(audio_data)
        print("Transcription: " + text)
        return text
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
    except sr.RequestError as e:
        print(f"Could not request results; {e}")

def translate_text(text, target_lang):
    translator = Translator()
    translated = translator.translate(text, dest=target_lang)
    print(f"Translation in {target_lang}: {translated.text}")
    return translated.text

def main():
    filename = "recorded_audio.wav"
    duration = 10  # Duration in seconds
    target_language = input("Enter the target language code (e.g., 'es' for Spanish, 'fr' for French, etc.): ")
    
    record_audio(filename, duration)
    text = transcribe_audio(filename)
    
    if text:
        translate_text(text, target_language)

if __name__ == "__main__":
    main()
