import { Routes, Route } from "react-router-dom";
import Landing from "./Landing/Landing";

import UploadPage from "./Upload/UploadPage";

export default function Pages() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/upload" element={<UploadPage />} />
        </Routes>
    );
}
