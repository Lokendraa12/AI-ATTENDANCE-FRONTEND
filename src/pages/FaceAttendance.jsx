import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import Sidebar from "../components/Sidebar";
import { Icon } from "@iconify/react";

const API_URL = "https://ai-attendance-backend-42u1.onrender.com";
const MODEL_PATH = "/models";

const DETECTOR_OPTIONS = {
  inputSize: 320,
  scoreThreshold: 0.3,
};

const MATCH_THRESHOLD = 0.45;
const MAX_SCAN_ATTEMPTS = 15;
const SCAN_INTERVAL = 400;

function FaceAttendance() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const [message, setMessage] = useState("Loading face models...");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [students, setStudents] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);

  // =========================================================
  // INITIALIZE
  // =========================================================

  const initializeSystem = useCallback(async () => {
    try {
      await loadModels();
      await fetchStudents();
    } catch (error) {
      console.error("System initialization error:", error);

      setMessage(
        "Unable to initialize face attendance system."
      );
    }
  }, []);

  // =========================================================
  // LOAD FACE API MODELS
  // =========================================================

  const loadModels = async () => {
    try {
      setMessage("Loading AI face models...");

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
      ]);

      setModelsLoaded(true);
      setMessage("AI models loaded successfully.");
    } catch (error) {
      console.error("Model loading error:", error);

      setModelsLoaded(false);

      throw new Error(
        "Failed to load face recognition models."
      );
    }
  };

  // =========================================================
  // FETCH REGISTERED STUDENTS
  // =========================================================

  const fetchStudents = async () => {
    try {
      setMessage("Loading registered students...");

      const response = await axios.get(
        `${API_URL}/api/students`,
        {
          timeout: 15000,
        }
      );

      const studentList = Array.isArray(response.data?.students)
        ? response.data.students
        : [];

      setStudents(studentList);

      if (studentList.length === 0) {
        setMessage(
          "No registered students found."
        );
        return;
      }

      const descriptors =
        await createStudentDescriptors(studentList);

      setLabeledDescriptors(descriptors);

      if (descriptors.length === 0) {
        setMessage(
          "No valid registered face found."
        );
        return;
      }

      setMessage(
        "System ready. Start camera and scan face."
      );
    } catch (error) {
      console.error("Student loading error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to load students from server."
      );
    }
  };

  // =========================================================
  // CREATE STUDENT FACE DESCRIPTORS
  // =========================================================

  const createStudentDescriptors = async (studentList) => {
    const descriptors = [];

    for (const student of studentList) {
      if (!student?.faceImage || !student?.rollNo) {
        continue;
      }

      try {
        const image = await loadBase64Image(
          student.faceImage
        );

        const detection = await faceapi
          .detectSingleFace(
            image,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.2,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          console.warn(
            `No face detected for student: ${student.rollNo}`
          );

          continue;
        }

        descriptors.push(
          new faceapi.LabeledFaceDescriptors(
            String(student.rollNo),
            [detection.descriptor]
          )
        );
      } catch (error) {
        console.error(
          `Failed to process face for student ${student.rollNo}:`,
          error
        );
      }
    }

    return descriptors;
  };

  // =========================================================
  // LOAD BASE64 IMAGE
  // =========================================================

  const loadBase64Image = (src) => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);

      image.onerror = () =>
        reject(
          new Error("Unable to load student face image.")
        );

      image.src = src;
    });
  };

  // =========================================================
  // START CAMERA
  // =========================================================

  const startCamera = async () => {
    try {
      if (isCameraOn) {
        return;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setMessage(
          "Camera is not supported by this browser."
        );
        return;
      }

      setMessage("Starting camera...");

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        stopStream(stream);
        return;
      }

      video.srcObject = stream;

      await new Promise((resolve, reject) => {
        const handleLoaded = () => {
          video.removeEventListener(
            "loadedmetadata",
            handleLoaded
          );

          resolve();
        };

        const handleError = () => {
          video.removeEventListener(
            "error",
            handleError
          );

          reject(
            new Error("Unable to initialize camera video.")
          );
        };

        video.addEventListener(
          "loadedmetadata",
          handleLoaded
        );

        video.addEventListener(
          "error",
          handleError
        );
      });

      await video.play();

      setIsCameraOn(true);

      setMessage(
        "Camera ready. Position your face inside the frame."
      );
    } catch (error) {
      console.error("Camera error:", error);

      setIsCameraOn(false);

      if (error.name === "NotAllowedError") {
        setMessage(
          "Camera permission was denied. Please allow camera access."
        );
      } else if (error.name === "NotFoundError") {
        setMessage(
          "No camera was found on this device."
        );
      } else {
        setMessage(
          "Unable to start camera. Please try again."
        );
      }
    }
  };

  // =========================================================
  // STOP CAMERA
  // =========================================================

  const stopCamera = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    const stream =
      streamRef.current ||
      videoRef.current?.srcObject;

    if (stream) {
      stopStream(stream);
    }

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
  }, []);

  // =========================================================
  // STOP MEDIA STREAM
  // =========================================================

  const stopStream = (stream) => {
    stream
      .getTracks()
      .forEach((track) => track.stop());
  };

  // =========================================================
  // DETECT LIVE FACE
  // =========================================================

  const detectLiveFace = async () => {
    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      return null;
    }

    return faceapi
      .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions(
          DETECTOR_OPTIONS
        )
      )
      .withFaceLandmarks()
      .withFaceDescriptor();
  };

  // =========================================================
  // SCAN FACE
  // =========================================================

  const scanFace = async () => {
    if (isScanning) {
      return;
    }

    if (!modelsLoaded) {
      setMessage(
        "Face models are still loading. Please wait."
      );
      return;
    }

    if (students.length === 0) {
      setMessage(
        "No registered students are available."
      );
      return;
    }

    if (labeledDescriptors.length === 0) {
      setMessage(
        "No registered student face is available."
      );
      return;
    }

    try {
      setIsScanning(true);

      // Start camera automatically
      if (!isCameraOn) {
        await startCamera();

        await delay(1000);
      }

      const video = videoRef.current;

      if (!video || video.readyState < 2) {
        setMessage(
          "Camera is not ready. Please try again."
        );

        setIsScanning(false);
        return;
      }

      setMessage(
        "Scanning face. Please look at the camera..."
      );

      const faceMatcher = new faceapi.FaceMatcher(
        labeledDescriptors,
        MATCH_THRESHOLD
      );

      let matchedRollNo = null;

      for (
        let attempt = 1;
        attempt <= MAX_SCAN_ATTEMPTS;
        attempt++
      ) {
        setMessage(
          `Scanning face... ${attempt}/${MAX_SCAN_ATTEMPTS}`
        );

        try {
          const detection =
            await detectLiveFace();

          if (detection) {
            const bestMatch =
              faceMatcher.findBestMatch(
                detection.descriptor
              );

            if (
              bestMatch.label !== "unknown" &&
              bestMatch.distance <= MATCH_THRESHOLD
            ) {
              matchedRollNo = bestMatch.label;
              break;
            }
          }
        } catch (error) {
          console.error(
            "Face detection error:",
            error
          );
        }

        await delay(SCAN_INTERVAL);
      }

      // =====================================================
      // FACE NOT MATCHED
      // =====================================================

      if (!matchedRollNo) {
        setMessage(
          "Face not recognized. Please try again with your face clearly visible."
        );

        setIsScanning(false);
        return;
      }

      // =====================================================
      // MARK ATTENDANCE
      // =====================================================

      setMessage(
        "Face recognized. Marking attendance..."
      );

      const response = await axios.post(
        `${API_URL}/api/attendance/mark`,
        {
          rollNo: matchedRollNo,
        },
        {
          timeout: 15000,
        }
      );

      setMessage(
        response.data?.message ||
          "Attendance marked successfully."
      );

      // Stop camera after successful attendance
      await delay(2000);

      stopCamera();

      setMessage(
        "Ready for the next attendance scan."
      );
    } catch (error) {
      console.error(
        "Attendance processing error:",
        error
      );

      const serverMessage =
        error.response?.data?.message;

      setMessage(
        serverMessage ||
          "Unable to mark attendance. Please try again."
      );
    } finally {
      setIsScanning(false);
    }
  };

  // =========================================================
  // DELAY HELPER
  // =========================================================

  const delay = (milliseconds) =>
    new Promise((resolve) =>
      setTimeout(resolve, milliseconds)
    );

  // =========================================================
  // INITIALIZE + CLEANUP
  // =========================================================

  useEffect(() => {
    initializeSystem();

    return () => {
      stopCamera();
    };
  }, [initializeSystem, stopCamera]);

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="premium-layout">
      <Sidebar />

      <main className="premium-main">
        <div className="top-header">
          <div>
            <h1>Face Attendance</h1>

            <p>
              Scan your face to mark attendance
            </p>
          </div>
        </div>

        <div className="scanner-wrapper">
          {/* ================= SCANNER CARD ================= */}

          <div className="scanner-card">

            {/* SYSTEM STATUS */}

            <div className="scanner-status">
              <span
                className={
                  modelsLoaded
                    ? "dot active-dot"
                    : "dot"
                }
              />

              {modelsLoaded
                ? "AI Models Ready"
                : "Loading AI Models..."}
            </div>

            {/* CAMERA */}

            <div className="premium-camera-box">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />

              <div className="scan-frame">
                <span className="corner top-left" />
                <span className="corner top-right" />
                <span className="corner bottom-left" />
                <span className="corner bottom-right" />

                {isScanning && (
                  <div className="premium-scan-line" />
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}

            <div className="premium-camera-actions">
              {!isCameraOn ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="start-btn"
                  disabled={
                    !modelsLoaded ||
                    isScanning
                  }
                >
                  Start Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="stop-btn"
                  disabled={isScanning}
                >
                  Stop Camera
                </button>
              )}

              <button
                type="button"
                onClick={scanFace}
                className="scan-btn"
                disabled={
                  isScanning ||
                  !modelsLoaded ||
                  labeledDescriptors.length === 0
                }
              >
                {isScanning
                  ? "Scanning..."
                  : "Scan & Mark Attendance"}
              </button>
            </div>

            {/* STATUS MESSAGE */}

            <p className="premium-scan-message">
              {message}
            </p>
          </div>

          {/* ================= INFORMATION CARD ================= */}

          <div className="scan-info-card">
            <h2>Scan Instructions</h2>

            <p>
              <Icon
                icon="mdi:check-circle"
                color="green"
                height="20"
              />
              Keep your face centered.
            </p>

            <p>
              <Icon
                icon="mdi:check-circle"
                color="green"
                height="20"
              />
              Use good lighting.
            </p>

            <p>
              <Icon
                icon="mdi:check-circle"
                color="green"
                height="20"
              />
              Only one face should be visible.
            </p>

            <p>
              <Icon
                icon="mdi:check-circle"
                color="green"
                height="20"
              />
              Make sure your face is clearly visible.
            </p>

            <p>
              <Icon
                icon="mdi:check-circle"
                color="green"
                height="20"
              />
              Attendance is marked after a successful
              face match.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FaceAttendance;