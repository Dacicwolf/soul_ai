import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const waitForSession = async () => {
            // 🔑 așteaptă ca Supabase să proceseze tokenul din URL
            const { data } = await supabase.auth.getSession();

            if (!mounted) return;

            if (data?.session) {
                navigate("/", { replace: true });
            }
        };

        waitForSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session && mounted) {
                navigate("/", { replace: true });
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [navigate]);

    const sendMagicLink = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // 🔑 FOARTE IMPORTANT
                emailRedirectTo: window.location.origin,
            },
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: "url('/login-bg.jpg')" }}
        >
            <div className="absolute inset-0 bg-black/20" />

            <div className="relative bg-white/85 backdrop-blur-xl p-6 rounded-2xl shadow-xl w-80">
                <h1 className="text-xl mb-4 text-center font-medium">Login</h1>

                {sent ? (
                    <p className="text-sm text-center">
                        Ți-am trimis un link pe email.
                        <br />
                        Deschide-l pentru a te autentifica.
                    </p>
                ) : (
                    <form onSubmit={sendMagicLink}>
                        <input
                            type="email"
                            required
                            placeholder="Email"
                            className="w-full mb-3 p-2 border rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-2 bg-black text-white rounded"
                        >
                            {loading ? "Se trimite..." : "Trimite magic link"}
                        </button>

                        {error && (
                            <p className="text-red-600 text-sm mt-3 text-center">{error}</p>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
