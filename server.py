#memories are being summarized by llama and getting stored in a file called Memory 
#current problems i am facing:
  #when the user Speaks for long in memory it registers as user said multiple things in a go
  #Sometimes when user is speaking for long the model starts to talk in between 
import asyncio
import websockets
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import json
from groq import Groq
import os

load_dotenv() 

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def home():
    return FileResponse("static/index.html")

# API Keys & Endpoints
DEEPGRAM_STT_URL = "wss://api.deepgram.com/v1/listen?model=nova-3"
DEEPGRAM_TTS_URL = "wss://api.deepgram.com/v1/speak?model=aura-luna-en&encoding=linear16&sample_rate=24000"


DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
client = Groq()

# Memory
MEMORY_FILE = "memory.json"
summarized_memory = []

def load_memory():
    if not os.path.exists(MEMORY_FILE) or os.path.getsize(MEMORY_FILE) == 0:
        return []  # or {} or None depending on your use
    with open(MEMORY_FILE, "r") as f:
        return json.load(f)

def save_memory(data):
    with open(MEMORY_FILE, "w") as f:
        json.dump(data, f, indent=2)



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ Frontend connected!")

    conversation_history = load_memory()
    latest_user_input = ""
    current_task = None

    async with websockets.connect(
        DEEPGRAM_STT_URL,
        additional_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"}
    ) as deepgram_ws:

        async def receive_audio():
            try:
                async for message in websocket.iter_bytes():
                    await deepgram_ws.send(message)
            except Exception as e:
                print(f"❌ Error receiving audio: {e}")

        async def process_transcription():
            nonlocal latest_user_input, current_task
            async for message in deepgram_ws:
                try:
                    data = json.loads(message)
                    transcript = data["channel"]["alternatives"][0]["transcript"].strip()
                    if transcript:
                        print(f"👤 User said: {transcript}")
                        latest_user_input += " " + transcript

                        if current_task and not current_task.done():
                            print("🛑 Cancelling previous generation...")
                            current_task.cancel()
                            try:
                                await current_task
                            except asyncio.CancelledError:
                                print("🧹 Cleaned up old task.")

                        current_task = asyncio.create_task(
                            send_llm_response(latest_user_input.strip(), websocket, conversation_history)
                        )
                except Exception as e:
                    print(f"❌ Transcription error: {e}")

        await asyncio.gather(receive_audio(), process_transcription())

    print("🚪 Frontend disconnected.")

async def summarize_with_llm(user_input: str) -> str:
    try:
        summary_prompt = [
            {"role": "system", "content": (
                "You are Lila, a friendly AI. "
                "Summarize the user's message in 1 sentence. "
                "If the message is nonsensical or random, reply with: 'user said something crazy'."
            )},
            {"role": "user", "content": user_input}
        ]

        response = client.chat.completions.create(
            messages=summary_prompt,
            model="meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature=0.3,
            max_tokens=50,
            stream=False,
        )
        summary = response.choices[0].message.content.strip()
        print(f"📝 Summary: {summary}")
        return summary
    except Exception as e:
        print(f"❌ Summarization error: {e}")
        return user_input[:50]

async def send_llm_response(user_input, websocket, conversation_history):
    summary = await summarize_with_llm(user_input)
    summarized_memory.append(summary)
    conversation_history.append({"role": "user", "content": summary})

    try:
        async with websockets.connect(
            DEEPGRAM_TTS_URL,
            additional_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"}
        ) as tts_ws:

            system_prompt = (
                "You are Lila, a friendly, empathetic AI friend. "
                "Keep answers short and natural. "
                "If confused, ask the user to clarify. "
                "You remember only recent history."
            )

            response = client.chat.completions.create(
                messages=[{"role": "system", "content": system_prompt}] + conversation_history,
                model="meta-llama/llama-4-maverick-17b-128e-instruct",
                stream=True,
            )

            full_response = ""
            buffer = ""

            for chunk in response:
                text_chunk = chunk.choices[0].delta.content if chunk.choices[0].delta else ""
                if text_chunk:
                    buffer += text_chunk
                    print(f"🤖 Lila: {text_chunk}")

                    if any(buffer.endswith(p) for p in [".", "?", "!", ","]):
                        await send_buffer_to_tts(buffer, websocket, tts_ws)
                        full_response += buffer
                        buffer = ""

            if buffer:
                await send_buffer_to_tts(buffer, websocket, tts_ws)
                full_response += buffer

            conversation_history.append({"role": "assistant", "content": full_response})
            save_memory(conversation_history)

    except asyncio.CancelledError:
        print("🛑 LLM task cancelled.")
        await websocket.send_text(json.dumps({"response": "[Speech Interrupted]"}))
        raise
    except Exception as e:
        print(f"❌ LLM response error: {e}")
        await websocket.send_text(json.dumps({"response": "Error generating response."}))

async def send_buffer_to_tts(text, websocket, tts_ws):
    print(f"🎤 Sending to TTS: {text}")
    await websocket.send_text(json.dumps({"response": text}))

    payload = json.dumps({"type": "Speak", "text": text})
    await tts_ws.send(payload)
    await tts_ws.send(json.dumps({"type": "Flush"}))

    audio_buffer = bytearray()

    try:
        while True:
            try:
                audio_data = await asyncio.wait_for(tts_ws.recv(), timeout=0.4)
                if isinstance(audio_data, bytes):
                    audio_buffer.extend(audio_data)
                elif isinstance(audio_data, str):
                    if json.loads(audio_data).get("type") == "end":
                        break
            except asyncio.TimeoutError:
                break
    except asyncio.CancelledError:
        print("🛑 Audio receive cancelled.")
        raise

    if audio_buffer:
        print("🔊 Sending audio to frontend.")
        await websocket.send_bytes(audio_buffer)
    else:
        print("⚠️ No audio received.")


