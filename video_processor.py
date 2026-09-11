import base64
import json
import math
import os
import urllib.request
import urllib.error
import cv2
from ultralytics import YOLO


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two GPS points in meters
    using the Haversine formula (standard library math).
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def is_duplicate_within_radius(
    problem: str,
    current_lat: float,
    current_lon: float,
    recorded_issues: list,
    radius_meters: float = 7.0,
) -> bool:
    """
    Checks if a problem of the same type has already been detected
    within the specified radius (default: 7.0 meters).
    """
    for item in recorded_issues:
        if item["problem"].lower() == problem.lower():
            dist = haversine_distance_meters(
                current_lat, current_lon, item["latitude"], item["longitude"]
            )
            if dist < radius_meters:
                return True
    return False


def send_detection_to_backend(payload: dict, backend_url: str = "http://localhost:8000/api/detections"):
    """
    Sends the detection JSON payload to the backend API.
    """
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        backend_url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status
    except urllib.error.URLError as e:
        print(f"[!] Warning: Could not send to backend ({backend_url}): {e}")
        return None


def get_simulated_gps(
    start_lat: float,
    start_lon: float,
    elapsed_seconds: float,
    speed_kmh: float = 30.0,
    heading_deg: float = 0.0,
):
    """
    Simulates bus GPS progression along a heading if no real hardware GPS stream is attached.
    30 km/h = ~8.33 meters/second.
    """
    distance_meters = (speed_kmh * 1000.0 / 3600.0) * elapsed_seconds
    R = 6371000.0
    heading_rad = math.radians(heading_deg)

    lat_rad = math.radians(start_lat)
    lon_rad = math.radians(start_lon)

    new_lat_rad = math.asin(
        math.sin(lat_rad) * math.cos(distance_meters / R)
        + math.cos(lat_rad) * math.sin(distance_meters / R) * math.cos(heading_rad)
    )
    new_lon_rad = lon_rad + math.atan2(
        math.sin(heading_rad) * math.sin(distance_meters / R) * math.cos(lat_rad),
        math.cos(distance_meters / R) - math.sin(lat_rad) * math.sin(new_lat_rad),
    )

    return {
        "latitude": round(math.degrees(new_lat_rad), 6),
        "longitude": round(math.degrees(new_lon_rad), 6),
    }


def process_video(
    video_path: str,
    model_path: str = "yolo26m.pt",
    backend_url: str = "http://localhost:8000/api/detections",
    conf_threshold: float = 0.3,
    frame_skip: int = 2,
    proximity_meters: float = 7.0,
    start_lat: float = 17.3850,
    start_lon: float = 78.4867,
    gps_lookup_fn=None,
):
    """
    Processes video frame-by-frame with YOLO tracking, avoiding duplicate problem generation:
    1. Multi-object tracking (track_id filter) to avoid duplicate detection of the same visual object.
    2. 7-meter GPS coordinate proximity filter to avoid reporting defects within 7m of a known defect.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at: {video_path}")

    # If yolo26m.pt is not found locally, fallback to yolov8m.pt or download standard
    if not os.path.exists(model_path) and model_path == "yolo26m.pt":
        print("[!] Note: 'yolo26m.pt' not found locally in directory, defaulting to 'yolov8m.pt'...")
        model_path = "yolov8m.pt"

    print(f"[*] Loading YOLO model from '{model_path}'...")
    model = YOLO(model_path)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_idx = 0

    # De-duplication states
    reported_track_ids = set()
    recorded_issues = []  # Stores: [{"problem": str, "latitude": float, "longitude": float}]

    print(f"[*] Processing: {video_path} | Tracking enabled | De-duplication threshold: {proximity_meters}m")

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            if frame_idx % frame_skip != 0:
                continue

            timestamp_sec = round(frame_idx / fps, 2)

            # Get current GPS coordinates (custom lookup or bus speed simulation)
            if gps_lookup_fn:
                current_location = gps_lookup_fn(frame_idx, timestamp_sec)
            else:
                current_location = get_simulated_gps(start_lat, start_lon, timestamp_sec)

            current_lat = current_location["latitude"]
            current_lon = current_location["longitude"]

            # Run YOLO Multi-Object Tracking across consecutive frames
            results = model.track(source=frame, conf=conf_threshold, persist=True, verbose=False)

            for r in results:
                if r.boxes is None or len(r.boxes) == 0:
                    continue

                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    problem = model.names[cls_id]
                    confidence = round(float(box.conf[0].item()), 4)

                    # Extract persistent tracking ID assigned by YOLO tracker
                    track_id = int(box.id[0].item()) if box.id is not None else None

                    # --- FILTER 1: Frame-by-Frame Track ID De-Duplication ---
                    if track_id is not None:
                        if track_id in reported_track_ids:
                            # Already sent this exact tracked object instance
                            continue

                    # --- FILTER 2: 7-Meter Spatial Proximity De-Duplication ---
                    if is_duplicate_within_radius(
                        problem=problem,
                        current_lat=current_lat,
                        current_lon=current_lon,
                        recorded_issues=recorded_issues,
                        radius_meters=proximity_meters,
                    ):
                        print(
                            f"[-] Suppressed duplicate '{problem}' at ({current_lat}, {current_lon}): "
                            f"already detected within {proximity_meters}m."
                        )
                        if track_id is not None:
                            reported_track_ids.add(track_id)
                        continue

                    # Passed both de-duplication filters! Encode frame image to bytes
                    success, buffer = cv2.imencode(".jpg", frame)
                    if not success:
                        continue
                    b64_image = base64.b64encode(buffer.tobytes()).decode("ascii")

                    payload = {
                        "problem": problem,
                        "confidence": confidence,
                        "location": {
                            "latitude": current_lat,
                            "longitude": current_lon,
                        },
                        "image_bytes": b64_image,
                        "track_id": track_id,
                        "timestamp_sec": timestamp_sec,
                    }

                    print(
                        f"[+] NEW VALID DETECTION | Problem: {problem.upper()} | Conf: {confidence:.2f} | "
                        f"Track ID: {track_id} | GPS: ({current_lat}, {current_lon})"
                    )

                    # Register as reported
                    if track_id is not None:
                        reported_track_ids.add(track_id)

                    recorded_issues.append({
                        "problem": problem,
                        "latitude": current_lat,
                        "longitude": current_lon,
                    })

                    # Transmit to backend
                    send_detection_to_backend(payload, backend_url)

    finally:
        cap.release()
        print(f"[*] Processing complete. Unique defects recorded: {len(recorded_issues)}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: py -3 video_processor.py <video_path.mp4> [model_path.pt] [backend_url]")
        sys.exit(1)

    vid = sys.argv[1]
    mdl = sys.argv[2] if len(sys.argv) > 2 else "yolov8n.pt"
    url = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:8000/api/detections"

    process_video(video_path=vid, model_path=mdl, backend_url=url)
