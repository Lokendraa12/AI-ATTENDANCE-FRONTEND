import Navbar from "../components/Navbar";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import { Icon } from "@iconify/react";

function Home() {
  const videoRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [scanMessage, setScanMessage] = useState("Click Get Started");

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
    } catch (error) {
      setScanMessage("Models not loaded. Check public/models folder.");
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get("https://ai-attendance-backend-42u1.onrender.com/api/students");
      setStudents(res.data.students);
    } catch (error) {
      setScanMessage("Students not loaded from backend.");
    }
  };

 const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    videoRef.current.srcObject = stream;

    setCameraOn(true);

    setScanMessage("camera started. Click scan face.");

  } catch (error) {
    setScanMessage("Camera permission denied.");
  }
};

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();

      tracks.forEach((track) => track.stop());

      videoRef.current.srcObject = null;
      setCameraOn(false);
    }
  };

  const loadStudentFaces = async () => {
    const labeledDescriptors = [];

    for (const student of students) {
      if (!student.faceImage) continue;

      const imageUrl = student.faceImage.startsWith("http")
        ? student.faceImage
        : `https://ai-attendance-backend-42u1.onrender.com${student.faceImage}`;

      const img = await faceapi.fetchImage(imageUrl);

      const detection = await faceapi
        .detectSingleFace(
          img,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.6,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        labeledDescriptors.push(
          new faceapi.LabeledFaceDescriptors(student.rollNo, [
            detection.descriptor,
          ])
        );
      }
    }

    return labeledDescriptors;
  };

  const handleGetStarted = async () => {
    if (!modelsLoaded) {
      setScanMessage("Models loading... please wait.");
      return;
    }

    if (!cameraOn) {
      await startCamera();
      return;
    }

    setScanMessage("Scanning face...");

    const labeledDescriptors = await loadStudentFaces();

    if (labeledDescriptors.length === 0) {
      setScanMessage("No registered face found.");
      return;
    }

    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.6,
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setScanMessage("No face detected. Look at camera.");
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.35);
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

    if (bestMatch.label === "unknown" || bestMatch.distance > 0.35) {
      setScanMessage("Face not matched.");
      return;
    }

    try {
      const res = await axios.post("https://ai-attendance-backend-42u1.onrender.com/api/attendance/mark", {
        rollNo: bestMatch.label,
      });
      setScanMessage(`✅ Attendance Marked | Roll No: ${bestMatch.label}`);

      setTimeout(() => {
        setScanMessage("");
        stopCamera();
      }, 3000);
    } catch (error) {
      setScanMessage(error.response?.data?.message || "Attendance not marked.");
    }
  };
  return (
    <div>
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <p className="tagline">AI Based Attendance System</p>

          <h1>Smart Attendance Using AI Face Recognition</h1>

          <p className="hero-text">
            A modern web-based attendance system that uses face recognition
            technology to mark student attendance automatically, accurately and
            securely.
          </p>

          <div className="hero-buttons">
            {!cameraOn ? (
  <button className="primary-btn" onClick={startCamera}>
    Get Started
  </button>
) : (
  <>
    <button className="primary-btn" onClick={handleGetStarted}>
      Scan Face
    </button>

    <button className="secondary-btn" onClick={stopCamera}>
      Stop Camera
    </button>
  </>
)}
          </div>
        </div>

        <div className="hero-card">
          <div className="face-box">
            <video ref={videoRef} autoPlay playsInline muted></video>
            <div className="scan-line"></div>
            <span onClick={handleGetStarted}>
              {scanMessage }
            </span>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <h2>Project Features</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Face Detection</h3>
            <p>Detect student face using camera and AI technology.</p>
          </div>

          <div className="feature-card">
            <h3>Auto Attendance</h3>
            <p>Attendance will be marked automatically after face match.</p>
          </div>

          <div className="feature-card">
            <h3>Reports</h3>
            <p>Admin can view daily and monthly attendance reports.</p>
          </div>
        </div>
      </section>

      <section className="working" id="working">
        <h2>How It Works</h2>

        <div className="workflow-grid">

          <div className="workflow-card">
            <h3><Icon icon="solar:user-bold-duotone" width="24" height="24" /> Register Face</h3>
            <p>Admin uploads student face image into database.</p>
          </div>

          <div className="workflow-card">
            <h3><Icon icon="solar:camera-bold-duotone" width="24" height="24" /> Scan Face</h3>
            <p>Camera detects live student face in real-time.</p>
          </div>

          <div className="workflow-card">
            <h3><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="currentColor" d="M21.33 12.91c.09 1.55-.62 3.04-1.89 3.95l.77 1.49c.23.45.26.98.06 1.45c-.19.47-.58.84-1.06 1l-.79.25a1.69 1.69 0 0 1-1.86-.55L14.44 18c-.89-.15-1.73-.53-2.44-1.1c-.5.15-1 .23-1.5.23c-.88 0-1.76-.27-2.5-.79c-.53.16-1.07.23-1.62.22c-.79.01-1.57-.15-2.3-.45a4.1 4.1 0 0 1-2.43-3.61c-.08-.72.04-1.45.35-2.11c-.29-.75-.32-1.57-.07-2.33C2.3 7.11 3 6.32 3.87 5.82c.58-1.69 2.21-2.82 4-2.7c1.6-1.5 4.05-1.66 5.83-.37c.42-.11.86-.17 1.3-.17c1.36-.03 2.65.57 3.5 1.64c2.04.53 3.5 2.35 3.58 4.47c.05 1.11-.25 2.2-.86 3.13c.07.36.11.72.11 1.09m-5-1.41c.57.07 1.02.5 1.02 1.07a1 1 0 0 1-1 1h-.63c-.32.9-.88 1.69-1.62 2.29c.25.09.51.14.77.21c5.13-.07 4.53-3.2 4.53-3.25a2.59 2.59 0 0 0-2.69-2.49a1 1 0 0 1-1-1a1 1 0 0 1 1-1c1.23.03 2.41.49 3.33 1.3c.05-.29.08-.59.08-.89c-.06-1.24-.62-2.32-2.87-2.53c-1.25-2.96-4.4-1.32-4.4-.4c-.03.23.21.72.25.75a1 1 0 0 1 1 1c0 .55-.45 1-1 1c-.53-.02-1.03-.22-1.43-.56c-.48.31-1.03.5-1.6.56c-.57.05-1.04-.35-1.07-.9a.97.97 0 0 1 .88-1.1c.16-.02.94-.14.94-.77c0-.66.25-1.29.68-1.79c-.92-.25-1.91.08-2.91 1.29C6.75 5 6 5.25 5.45 7.2C4.5 7.67 4 8 3.78 9c1.08-.22 2.19-.13 3.22.25c.5.19.78.75.59 1.29c-.19.52-.77.78-1.29.59c-.73-.32-1.55-.34-2.3-.06c-.32.27-.32.83-.32 1.27c0 .74.37 1.43 1 1.83c.53.27 1.12.41 1.71.4q-.225-.39-.39-.81a1.038 1.038 0 0 1 1.96-.68c.4 1.14 1.42 1.92 2.62 2.05c1.37-.07 2.59-.88 3.19-2.13c.23-1.38 1.34-1.5 2.56-1.5m2 7.47l-.62-1.3l-.71.16l1 1.25zm-4.65-8.61a1 1 0 0 0-.91-1.03c-.71-.04-1.4.2-1.93.67c-.57.58-.87 1.38-.84 2.19a1 1 0 0 0 1 1c.57 0 1-.45 1-1c0-.27.07-.54.23-.76c.12-.1.27-.15.43-.15c.55.03 1.02-.38 1.02-.92"></path></svg> AI Match</h3>
            <p>face-api.js compares live face with stored face data.</p>
          </div>

          <div className="workflow-card">
            <h3><Icon icon="solar:check-circle-bold-duotone" width="24" height="24" /> Attendance Marked</h3>
            <p>Attendance automatically saved in MongoDB database.</p>
          </div>

        </div>
      </section>

      <section className="about" id="about">
        <h2>About Project</h2>

        <div className="about-grid">

          <div className="about-card">
            <h3><Icon icon="solar:target-bold-duotone" width="24" height="24" /> Main Objective</h3>
            <p>
              Reduce manual attendance and avoid proxy attendance using AI.
            </p>
          </div>

          <div className="about-card">
            <h3><Icon icon="solar:lightning-bold-duotone" width="24" height="24" /> Fast Attendance</h3>
            <p>
              Student attendance is marked within seconds using face recognition.
            </p>
          </div>

          <div className="about-card">
            <h3><Icon icon="solar:lock-bold-duotone" width="24" height="24" /> Secure System</h3>
            <p>
              Only registered student faces can mark attendance.
            </p>
          </div>

          <div className="about-card">
            <h3><Icon icon="solar:chart-bold-duotone" width="24" height="24" /> Smart Reports</h3>
            <p>
              Admin can monitor attendance records and reports easily.
            </p>
          </div>

        </div>
      </section>

      <section className="tech-section">

        <h2>Technologies Used</h2>

        <div className="tech-grid">

          <div className="tech-card"> <Icon icon="logos:react" width="20" />React.js</div>
          <div className="tech-card">      <Icon icon="logos:nodejs-icon" width="20" /> Node.js</div>
          <div className="tech-card"> <Icon icon="skill-icons:expressjs-dark" width="20" /> Express.js</div>
          <div className="tech-card">  <Icon icon="logos:mongodb-icon" width="20" /> MongoDB</div>
          <div className="tech-card">  <Icon icon="mdi:face-recognition" width="20  " /> face-api.js</div>
          <div className="tech-card"><Icon icon="solar:camera-bold-duotone" width="24" height="24" /> AI Face Recognition</div>

        </div>

      </section>

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

      <footer>
        <p>© 2026 Attendify AI | Major Project</p>
      </footer>
    </div>
  );
}

export default Home;