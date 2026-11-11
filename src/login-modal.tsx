
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth-context";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({
  open,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await loginWithGoogle();

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || "Кіру мүмкін болмады.");
      }
    } catch (authError) {
      console.error("Кіру қатесі:", authError);
      setError("Қате орын алды. Интернет байланысын тексеріңіз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => {
            if (!loading) onClose();
          }}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 relative shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />

            <button
              onClick={onClose}
              disabled={loading}
              aria-label="Терезені жабу"
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 disabled:opacity-50"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>

              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                BAIX KZ-ке қош келдіңіз!
              </h2>

              <p className="text-sm font-medium text-slate-400 mt-2">
                Аккаунтыңызға Google арқылы кіріңіз.
                Телефон нөмірі мен PIN қажет емес.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-4 px-5 bg-blue-600 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 48 48"
                    className="w-5 h-5"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                      transform="translate(0 5)"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 37.95 46.98 31.9 46.98 24.55Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                      transform="translate(0 5)"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                    />
                  </svg>
                )}
                {loading ? "Кіру жүріп жатыр..." : "Google арқылы кіру"}
              </button>

              {error && (
                <p
                  role="alert"
                  className="text-sm font-semibold text-red-600 text-center"
                >
                  {error}
                </p>
              )}

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-5 text-slate-500">
                  Кіру Google аккаунтыңыз арқылы орындалады. Құпиясөзіңіз
                  BAIX KZ қосымшасына берілмейді.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
