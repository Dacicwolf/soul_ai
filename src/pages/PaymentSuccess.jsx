import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    useEffect(() => {
        // opțional: poți folosi pack-ul mai târziu
        const pack = params.get("pack");

        // mic feedback vizual, apoi redirect
        const timer = setTimeout(() => {
            navigate("/chat", { replace: true });
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigate, params]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                <h1 className="text-2xl font-bold text-green-600 mb-3">
                    Plata reușită ✅
                </h1>
                <p className="text-gray-700 mb-2">
                    Îți mulțumim! Mesajele tale vor fi disponibile imediat.
                </p>
                <p className="text-sm text-gray-500">
                    Te redirecționăm către conversație…
                </p>
            </div>
        </div>
    );
}
