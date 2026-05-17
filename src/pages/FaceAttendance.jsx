import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import Sidebar from "../components/Sidebar";
import { Icon } from "@iconify/react";

const API_URL = "https://ai-attendance-backend-42u1.onrender.com";

function FaceAttendance() {
  const videoRef = useRef(null);

  const [message, setMessage] = useState("Loading face models...");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [students, setStudents] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);

  useEffect(() => {
    initSystem();

    return () => {
      stopCamera();
    };
  }, []);

  const initSystem = async () => {
    await loadModels();
  };

  const loadModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      setModelsLoaded(true);
      setMessage("Models loaded. Loading student faces...");

      await fetchStudents();
    } catch (error) {
      setMessage("Models not loaded. Check public/models folder.");
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/students`);
      const allStudents = res.data.students || [];

      setStudents(allStudents);

      const descriptors = await createStudentDescriptors(allStudents);
      setLabeledDescriptors(descriptors);

      setMessage("System ready. Start camera and scan face.");
    } catch (error) {
      setMessage("Students not loaded from backend.");
    }
  };

  const createStudentDescriptors = async (studentList) => {
    const descriptors = [];

    for (const student of studentList) {
      if (!student.faceImage) continue;

      try {
        const img = await faceapi.fetchImage(student.faceImage);

        const detection = await faceapi
          .detectSingleFace(
            img,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.3,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          console.log("No face detected in saved image:", student.name);
          continue;
        }

        descriptors.push(
          new faceapi.LabeledFaceDescriptors(student.rollNo, [
            detection.descriptor,
          ])
        );
      } catch (error) {
        console.log("Image error:", student.name);
      }
    }

    return descriptors;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;

      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          resolve();
        };
      });

      setIsCameraOn(true);
      setMessage("Camera started. Now scan face.");
    } catch (error) {
      setIsCameraOn(false);
      setMessage("Camera permission denied or not available.");
    }
  };

  const stopCamera = () => {
    if (!videoRef.current) return;

    const stream = videoRef.current.srcObject;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
  };

  const scanFace = async () => {
  if (isScanning) return;

  if (!modelsLoaded) {
    alert("Models are still loading. Please wait.");
    return;
  }

  if (students.length === 0) {
    alert("No students found. Please add student first.");
    return;
  }

  if (labeledDescriptors.length === 0) {
    setMessage("No registered student face found.");
    return;
  }

  try {
    setIsScanning(true);

    if (!isCameraOn) {
      await startCamera();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setMessage("Scanning face... Please look at camera.");

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.32);

    let matchedRollNo = null;
    let lastDistance = null;

    for (let i = 1; i <= 12; i++) {
      setMessage(`Scanning face... Please wait  .`);

      const liveDetection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.45,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (liveDetection) {
        const bestMatch = faceMatcher.findBestMatch(liveDetection.descriptor);
        lastDistance = bestMatch.distance;

        if (bestMatch.label !== "unknown" && bestMatch.distance <= 0.32) {
          matchedRollNo = bestMatch.label;
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!matchedRollNo) {
      setMessage(
        lastDistance
          ? `❌ Face not matched. Distance: ${lastDistance.toFixed(2)}`
          : "❌ No face detected. Please look at camera."
      );
      setIsScanning(false);
      return;
    }

    const res = await axios.post(`${API_URL}/api/attendance/mark`, {
      rollNo: matchedRollNo,
    });

    setMessage(`✅ ${res.data.message} | Roll No: ${matchedRollNo}`);

    setTimeout(() => {
      stopCamera();
      setMessage("Ready for next scan.");
      setIsScanning(false);
    }, 2500);
  } catch (error) {
    setMessage(error.response?.data?.message || "Attendance not marked.");
    setIsScanning(false);
  }
};

  return (
    <div className="premium-layout">
      <Sidebar />

      <main className="premium-main">
        <div className="top-header">
          <div>
            <h1>Face Attendance</h1>
            <p>Scan your face to mark attendance</p>
          </div>
        </div>

        <div className="scanner-wrapper">
          <div className="scanner-card">
            <div className="scanner-status">
              <span className={modelsLoaded ? "dot active-dot" : "dot"}></span>
              {modelsLoaded ? "AI Models Loaded" : "Loading AI Models..."}
            </div>

            <div className="premium-camera-box">
              <video ref={videoRef} autoPlay playsInline muted></video>

              <div className="scan-frame">
                <span className="corner top-left"></span>
                <span className="corner top-right"></span>
                <span className="corner bottom-left"></span>
                <span className="corner bottom-right"></span>
                <div className="premium-scan-line"></div>
              </div>
            </div>

            <div className="premium-camera-actions">
              {!isCameraOn ? (
                <button onClick={startCamera} className="start-btn">
                  Start Camera
                </button>
              ) : (
                <button onClick={stopCamera} className="stop-btn">
                  Stop Camera
                </button>
              )}

              <button
                onClick={scanFace}
                className="scan-btn"
                disabled={isScanning}
              >
                {isScanning ? "Scanning..." : "Scan & Mark Attendance"}
              </button>
            </div>

            <p className="premium-scan-message">{message}</p>
          </div>

          <div className="scan-info-card">
            <h2>Scan Instructions</h2>

            <p>
              <Icon icon="mdi:check-circle" color="green" height="20px" /> Face
              center me rakho
            </p>
            <p>
              <Icon icon="mdi:check-circle" color="green" height="20px" /> Good
              lighting use karo
            </p>
            <p>
              <Icon icon="mdi:check-circle" color="green" height="20px" /> Only
              one face visible hona chahiye
            </p>
            <p>
              <Icon icon="mdi:check-circle" color="green" height="20px" /> Face
              clear hona chahiye
            </p>
            <p>
              <Icon icon="mdi:check-circle" color="green" height="20px" /> AI
              face match hone par attendance mark hogi
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FaceAttendance;