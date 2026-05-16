import { use, useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import Sidebar from "../components/Sidebar";
import { Icon } from "@iconify/react";

function FaceAttendance() {
  const videoRef = useRef(null);

  const [message, setMessage] = useState("Loading face models...");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [students, setStudents] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadModels();
    fetchStudents();
  }, []);

  const loadModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      setModelsLoaded(true);
      setMessage("Models loaded. Start camera.");
    } catch (error) {
      setMessage("Models not loaded. Check public/models folder.");
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/students");
      setStudents(res.data.students);
    } catch (error) {
      setMessage("Students not loaded from backend.");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
      setMessage("Camera started. Now scan face.");
    } catch (error) {
      setIsCameraOn(false);
      setMessage("Camera permission denied or not available.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setMessage("Camera stopped.");
  };

 const loadStudentFaces = async () => {
  const labeledDescriptors = [];

  for (const student of students) {
    if (!student.faceImage) continue;

    try {
      const imageUrl = student.faceImage.startsWith("http")
        ? student.faceImage
        : `https://ai-attendance-backend-42u1.onrender.com${student.faceImage}`;

      console.log("Loading registered image:", imageUrl);

      const img = await faceapi.fetchImage(imageUrl);

      const detection = await faceapi
        .detectSingleFace(
          img,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.2,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.log("No face detected in image:", student.name);
        continue;
      }

      console.log("Face detected for:", student.name);

      labeledDescriptors.push(
        new faceapi.LabeledFaceDescriptors(student.rollNo, [
          detection.descriptor,
        ])
      );
    } catch (error) {
      console.log("Image error:", student.name, error);
    }
  }

  console.log("Total registered faces:", labeledDescriptors.length);
  return labeledDescriptors;
};




  const scanFace = async () => {
  if (!modelsLoaded) {
    alert("Models are still loading. Please wait.");
    return;
  }

  if (students.length === 0) {
    alert("No students found. Please add student first.");
    return;
  }

  try {
    // Camera already on nahi hai to pehle on karo
    if (!isCameraOn) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);

      // video load hone ka wait
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          resolve();
        };
      });
    }

    setMessage("Scanning face...");

    const labeledDescriptors = await loadStudentFaces();

    if (labeledDescriptors.length === 0) {
      setMessage("No registered student face found.");
      return;
    }

    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.2,
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setMessage("No face detected. Please look at camera.");
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.35);
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

    if (bestMatch.label === "unknown" || bestMatch.distance > 0.35) {
      setMessage(`❌ Face not matched. Distance: ${bestMatch.distance.toFixed(2)}`);
      return;
    }

    const matchedRollNo = bestMatch.label;

    const res = await axios.post("https://ai-attendance-backend-42u1.onrender.com/api/attendance/mark", {
      rollNo: matchedRollNo,
    });

    setMessage(`✅ ${res.data.message} | Roll No: ${matchedRollNo}`);

    setTimeout(() => {
      stopCamera();
      setMessage("Ready for next scan.");
    }, 3000);
  } catch (error) {
    setMessage(error.response?.data?.message || "Attendance not marked.");
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

            {modelsLoaded
              ? "AI Models Loaded"
              : "Loading AI Models..."}
          </div>

          <div className="premium-camera-box">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            ></video>

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
            <button onClick={scanFace} className="scan-btn">
              Scan & Mark Attendance
            </button>

          </div>

          <p className="premium-scan-message">
            {message}
          </p>

        </div>

        <div className="scan-info-card">
          <h2>Scan Instructions</h2>

          <p><Icon icon="mdi:check-circle" color="green" height={"20px"}/> Face center me rakho</p>
          <p><Icon icon="mdi:check-circle" color="green" height={"20px"}/> Good lighting use karo</p>
          <p><Icon icon="mdi:check-circle" color="green" height={"20px"}/> Only one face visible hona chahiye</p>
          <p><Icon icon="mdi:check-circle" color="green" height={"20px"}/> Face clear hona chahiye</p>
          <p><Icon icon="mdi:check-circle" color="green" height={"20px"}/> AI face match hone par attendance mark hogi</p>
        </div>

      </div>
    </main>
  </div>
);
}

export default FaceAttendance;