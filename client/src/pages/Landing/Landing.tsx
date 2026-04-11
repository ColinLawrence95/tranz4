import Login from "./Components/Login/Login";
import { useNavigate } from "react-router-dom";

function Landing() {
    const navigate = useNavigate();
    return (
        <div className="bg-gray-950 text-white min-h-screen flex items-center justify-center">
            <Login onAuthenticated={(token) => navigate("/upload", { state: { token } })} />
        </div>
    );
}
export default Landing;
