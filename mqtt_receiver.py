import base64
import json
import os
import paho.mqtt.client as mqtt

# MQTT Broker Configuration
BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
TOPIC = os.getenv("MQTT_TOPIC", "margdarshak/detections")


def extract_payload(data: dict):
    """
    Extracts the required fields from the received JSON data:
    - problem (defect / issue name)
    - confidence (confidence score)
    - location (coordinates)
    - image_bytes (decoded raw bytes)
    """
    # 1. Problem / Defect
    problem = data.get("problem") or data.get("issue") or data.get("issue_type")

    # 2. Confidence score
    confidence = data.get("confidence") or data.get("confidence_score")
    if confidence is not None:
        confidence = float(confidence)

    # 3. Location / Coordinates
    location = data.get("location") or data.get("gps") or data.get("coordinates")

    # 4. Image in bytes (decoded from base64 string)
    raw_img = data.get("image_bytes") or data.get("image")
    image_bytes = None
    if raw_img:
        if isinstance(raw_img, str):
            # Strip data URI header if present
            if "," in raw_img:
                raw_img = raw_img.split(",", 1)[1]
            image_bytes = base64.b64decode(raw_img)
        elif isinstance(raw_img, (bytes, bytearray)):
            image_bytes = bytes(raw_img)

    return {
        "problem": problem,
        "confidence": confidence,
        "location": location,
        "image_bytes": image_bytes,
    }


def on_connect(client, userdata, flags, rc_or_reason, properties=None):
    """Callback when connected to the MQTT broker."""
    # Compatible with both paho-mqtt v1 (int rc) and v2 (ReasonCode)
    code = getattr(rc_or_reason, "value", rc_or_reason)
    if code == 0:
        print(f"[*] Connected to MQTT Broker: {BROKER_HOST}:{BROKER_PORT}")
        client.subscribe(TOPIC)
        print(f"[*] Subscribed to topic: '{TOPIC}' (Waiting for incoming telemetry...)")
    else:
        print(f"[!] Connection failed with code: {rc_or_reason}")


def on_message(client, userdata, msg):
    """Callback triggered when a message is received over MQTT."""
    try:
        raw_payload = msg.payload.decode("utf-8")
        data = json.loads(raw_payload)
    except Exception as err:
        print(f"[!] Failed to parse incoming JSON: {err}")
        return

    # Extract required fields
    extracted = extract_payload(data)

    print("\n--- [Incoming Detection Received] ---")
    print(f"Problem:     {extracted['problem']}")
    print(f"Confidence:  {extracted['confidence']}")
    print(f"Location:    {extracted['location']}")
    byte_count = len(extracted["image_bytes"]) if extracted["image_bytes"] else 0
    print(f"Image Size:  {byte_count} bytes")

    # Hook for next pipeline stages
    process_data(
        problem=extracted["problem"],
        confidence=extracted["confidence"],
        location=extracted["location"],
        image_bytes=extracted["image_bytes"],
    )


def process_data(problem, confidence, location, image_bytes):
    """
    Hook ready for subsequent modules (e.g. depth estimation, GIS de-duplication, ticketing).
    """
    pass


def start_receiver():
    """Initializes and starts the MQTT client listener."""
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    except AttributeError:
        client = mqtt.Client()

    client.on_connect = on_connect
    client.on_message = on_message

    print(f"[*] Connecting to {BROKER_HOST}:{BROKER_PORT}...")
    client.connect(BROKER_HOST, BROKER_PORT, 60)
    client.loop_forever()


if __name__ == "__main__":
    start_receiver()
