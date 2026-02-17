import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl justify-center mb-2">PonchEO</h2>
          <p className="text-center text-sm opacity-70 mb-4">
            Redirigiendo...
          </p>
          <span className="loading loading-spinner loading-lg mx-auto"></span>
        </div>
      </div>
    </div>
  );
}
