import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set default dark mode
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
