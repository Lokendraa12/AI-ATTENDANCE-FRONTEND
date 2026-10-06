
import Navbar from "../components/Navbar";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import { Icon } from "@iconify/react";

const API_URL = "https://ai-attendance-backend-42u1.onrender.com";
const MODEL_PATH = "/models";

const DESCRIPTOR_THRESHOLD = 0.45;

function Home() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(
    "System loading..."
  );

  // =========================
  // LOAD MODELS
  // =========================
  const loadModels = async () => {
    try {
      setScanMessage("Loading AI models...");

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
      ]);

      setModelsLoaded(true);

      return true;
    } catch (error) {
      console.error("Model loading error:", error);

      setScanMessage(
        "AI models not loaded. Check public/models folder."
      );

      return false;
    }
  };

  // =========================
  // LOAD BASE64 IMAGE
  // =========================
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);

      img.onerror = () =>
        reject(new Error("Face image could not be loaded."));

      img.src = src;
    });
  };

  // =========================
  // CREATE STUDENT DESCRIPTORS
  // =========================
  const createStudentDescriptors = async (studentList) => {
    const descriptors = [];

    for (const student of studentList) {
      if (!student?.faceImage || !student?.rollNo) {
        continue;
      }

      try {
        const img = await loadImage(student.faceImage);

        const detection = await faceapi
          .detectSingleFace(
            img,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.2,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          console.warn(
            `No face detected for ${student.rollNo}`
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
          `Descriptor error for ${student.rollNo}:`,
          error
        );
      }
    }

    return descriptors;
  };

  // =========================
  // FETCH STUDENTS
  // =========================
  const fetchStudents = async () => {
    try {
      setScanMessage("Loading registered students...");

      const response = await axios.get(
        `${API_URL}/api/students`,
        {
          timeout: 15000,
        }
      );

      const studentList = Array.isArray(
        response.data?.students
      )
        ? response.data.students
        : [];

      if (studentList.length === 0) {
        setStudents([]);
        setLabeledDescriptors([]);
        setScanMessage("No students registered.");
        return;
      }

      setStudents(studentList);

      const descriptors =
        await createStudentDescriptors(studentList);

      setLabeledDescriptors(descriptors);

      if (descriptors.length === 0) {
        setScanMessage(
          "No registered student face found."
        );
        return;
      }

      setScanMessage(
        `System ready. ${descriptors.length} face(s) registered.`
      );
    } catch (error) {
      console.error("Student loading error:", error);

      setScanMessage(
        "Students could not be loaded from server."
      );
    }
  };

  // =========================
  // INITIALIZE SYSTEM
  // =========================
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const modelsReady = await loadModels();

      if (!mounted || !modelsReady) return;

      await fetchStudents();
    };

    initialize();

    return () => {
      mounted = false;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, []);

  // =========================
  // START CAMERA
  // =========================
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanMessage(
          "Camera is not supported by this browser."
        );
        return false;
      }

      if (streamRef.current) {
        return true;
      }

      setScanMessage("Starting camera...");

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

      if (!video) return false;

      video.srcObject = stream;

      await new Promise((resolve) => {
        if (video.readyState >= 1) {
          resolve();
        } else {
          video.onloadedmetadata = resolve;
        }
      });

      await video.play();

      setCameraOn(true);
      setScanMessage(
        "Camera ready. Click Scan Face."
      );

      return true;
    } catch (error) {
      console.error("Camera error:", error);

      setCameraOn(false);
      setScanMessage(
        "Camera permission denied or camera unavailable."
      );

      return false;
    }
  };

  // =========================
  // STOP CAMERA
  // =========================
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  };

  // =========================
  // SCAN FACE
  // =========================
  const handleGetStarted = async () => {
    if (isScanning) return;

    if (!modelsLoaded) {
      setScanMessage(
        "AI models are still loading..."
      );
      return;
    }

    if (students.length === 0) {
      setScanMessage("No students registered.");
      return;
    }

    if (labeledDescriptors.length === 0) {
      setScanMessage(
        "No registered student face found."
      );
      return;
    }

    try {
      setIsScanning(true);

      if (!cameraOn) {
        const started = await startCamera();

        if (!started) {
          setIsScanning(false);
          return;
        }
      }

      setScanMessage(
        "Scanning face... Please look at camera."
      );

      const faceMatcher = new faceapi.FaceMatcher(
        labeledDescriptors,
        DESCRIPTOR_THRESHOLD
      );

      let matchedRollNo = null;
      let lastDistance = null;

      // Try face detection multiple times
      for (let attempt = 0; attempt < 10; attempt++) {
        if (!videoRef.current) break;

        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.3,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const bestMatch =
            faceMatcher.findBestMatch(
              detection.descriptor
            );

          lastDistance = bestMatch.distance;

          if (
            bestMatch.label !== "unknown" &&
            bestMatch.distance <= DESCRIPTOR_THRESHOLD
          ) {
            matchedRollNo = bestMatch.label;
            break;
          }
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 250)
        );
      }

      // =========================
      // FACE NOT MATCHED
      // =========================
      if (!matchedRollNo) {
        setScanMessage(
          lastDistance !== null
            ? `Face not matched. Distance: ${lastDistance.toFixed(
                2
              )}`
            : "No face detected. Please look at camera."
        );

        setIsScanning(false);
        return;
      }

      // =========================
      // MARK ATTENDANCE
      // =========================
      setScanMessage(
        `Face matched. Marking attendance...`
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

      setScanMessage(
        `✅ ${
          response.data?.message ||
          "Attendance marked successfully"
        } | Roll No: ${matchedRollNo}`
      );

      setTimeout(() => {
        stopCamera();
        setScanMessage("Click Get Started");
        setIsScanning(false);
      }, 2500);
    } catch (error) {
      console.error("Attendance error:", error);

      setScanMessage(
        error.response?.data?.message ||
          "Attendance could not be marked."
      );

      setIsScanning(false);
    }
  };

  return (
    <div>
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-content">
          <p className="tagline">
            AI Based Attendance System
          </p>

          <h1>
            Smart Attendance Using AI Face Recognition
          </h1>

          <p className="hero-text">
            A modern web-based attendance system that
            uses face recognition technology to mark
            student attendance automatically, accurately
            and securely.
          </p>

          <div className="hero-buttons">
            {!cameraOn ? (
              <button
                className="primary-btn"
                onClick={startCamera}
                disabled={!modelsLoaded}
              >
                {modelsLoaded
                  ? "Get Started"
                  : "Loading..."}
              </button>
            ) : (
              <>
                <button
                  className="primary-btn"
                  onClick={handleGetStarted}
                  disabled={isScanning}
                >
                  {isScanning
                    ? "Scanning..."
                    : "Scan Face"}
                </button>

                <button
                  className="secondary-btn"
                  onClick={stopCamera}
                  disabled={isScanning}
                >
                  Stop Camera
                </button>
              </>
            )}
          </div>
        </div>

        {/* ================= CAMERA ================= */}
        <div className="hero-card">
          <div className="face-box">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            {isScanning && (
              <div className="scan-line"></div>
            )}

            <span>{scanMessage}</span>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="features" id="features">
        <h2>Project Features</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Face Detection</h3>
            <p>
              Detect student face using camera and AI
              technology.
            </p>
          </div>

          <div className="feature-card">
            <h3>Auto Attendance</h3>
            <p>
              Attendance is marked automatically after
              successful face matching.
            </p>
          </div>

          <div className="feature-card">
            <h3>Reports</h3>
            <p>
              Admin can view daily and monthly attendance
              reports.
            </p>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="working" id="working">
        <h2>How It Works</h2>

        <div className="workflow-grid">
          <div className="workflow-card">
            <h3>
              <Icon
                icon="solar:user-bold-duotone"
                width="24"
              />
              Register Face
            </h3>

            <p>
              Admin uploads student face image into
              database.
            </p>
          </div>

          <div className="workflow-card">
            <h3>
              <Icon
                icon="solar:camera-bold-duotone"
                width="24"
              />
              Scan Face
            </h3>

            <p>
              Camera detects live student face in
              real-time.
            </p>
          </div>

          <div className="workflow-card">
            <h3>
              <Icon
                icon="mdi:face-recognition"
                width="24"
              />
              AI Match
            </h3>

            <p>
              face-api.js compares the live face with
              registered face data.
            </p>
          </div>

          <div className="workflow-card">
            <h3>
              <Icon
                icon="solar:check-circle-bold-duotone"
                width="24"
              />
              Attendance Marked
            </h3>

            <p>
              Attendance is automatically saved in
              MongoDB.
            </p>
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section className="about" id="about">
        <h2>About Project</h2>

        <div className="about-grid">
          <div className="about-card">
            <h3>
              <Icon
                icon="solar:target-bold-duotone"
                width="24"
              />
              Main Objective
            </h3>

            <p>
              Reduce manual attendance and avoid proxy
              attendance using AI.
            </p>
          </div>

          <div className="about-card">
            <h3>
              <Icon
                icon="solar:lightning-bold-duotone"
                width="24"
              />
              Fast Attendance
            </h3>

            <p>
              Student attendance is marked within seconds
              using face recognition.
            </p>
          </div>

          <div className="about-card">
            <h3>
              <Icon
                icon="solar:lock-bold-duotone"
                width="24"
              />
              Secure System
            </h3>

            <p>
              Only registered student faces can mark
              attendance.
            </p>
          </div>

          <div className="about-card">
            <h3>
              <Icon
                icon="solar:chart-bold-duotone"
                width="24"
              />
              Smart Reports
            </h3>

            <p>
              Admin can monitor attendance records and
              reports easily.
            </p>
          </div>
        </div>
      </section>

      {/* ================= TECHNOLOGIES ================= */}
      
<section className="tech-section" id="technologies">
  <div className="tech-header">
    <span className="tech-label">TECH STACK</span>
    <h2>Technologies Used</h2>
    <p>
      Modern technologies powering the Attendify AI
      attendance system.
    </p>
  </div>

  <div className="tech-grid">
    <div className="tech-card">
      <Icon icon="logos:react" width="38" height="38" />
      <span>React.js</span>
    </div>

    <div className="tech-card">
      <Icon icon="logos:nodejs-icon" width="38" height="38" />
      <span>Node.js</span>
    </div>

    <div className="tech-card">
      <Icon
        icon="skill-icons:expressjs-dark"
        width="38"
        height="38"
      />
      <span>Express.js</span>
    </div>

    <div className="tech-card">
      <Icon icon="logos:mongodb-icon" width="38" height="38" />
      <span>MongoDB</span>
    </div>

    <div className="tech-card">
      <Icon icon="mdi:face-recognition" width="38" height="38" />
      <span>face-api.js</span>
    </div>

    <div className="tech-card">
      <Icon
        icon="solar:camera-bold-duotone"
        width="38"
        height="38"
      />
      <span>AI Face Recognition</span>
    </div>
  </div>
</section>



      {/* ================= FUTURE SCOPE ================= */}
      <section className="future-section">
        <h2>Future Scope</h2>

        <div className="future-grid">
          <div className="future-card">
            Mobile App Integration
          </div>

          <div className="future-card">
            Cloud Database Storage
          </div>

          <div className="future-card">
            CCTV Based Attendance
          </div>

          <div className="future-card">
            Email/SMS Notifications
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer>
        <p>© 2026 Attendify AI | Major Project</p>
      </footer>
    </div>
  );
}

export default Home;

