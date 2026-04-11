import FileUploader from "./Components/FileUploader";
import { Navigate, useLocation } from "react-router-dom";

type UploadRouteState = {
    token?: string;
};

function UploadPage() {
    const location = useLocation();
    const state = location.state as UploadRouteState | null;
    const token = state?.token;

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="bg-gray-950 text-white min-h-screen flex items-center justify-center">
            <FileUploader token={token} />
        </div>
    );
}
export default UploadPage;
