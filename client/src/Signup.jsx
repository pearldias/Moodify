import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signup } from "./auth";
import { useAuth } from "./AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import wavesgif from "./assets/waves2.gif";
import toast from "react-hot-toast";
import { importHistory } from "./historyApi";
import { getGuestHistory} from "./historyLocal";


const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "One uppercase letter")
    .regex(/[a-z]/, "One lowercase letter")
    .regex(/[0-9]/, "One digit")
    .regex(/[^A-Za-z0-9]/, "One special character"),
});

export default function Signup() {
  const { setSession, setLoading } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    const res = await signup(data);
    setLoading(false);
    if (!res.ok) return setError(res.error || "Signup failed");
    
    toast.success("Account created successfully!");
    setSession(res.data);

const uid = res.data?.user?.id;
if (uid) {
   const local = getGuestHistory();
   if (local.length) {
     try { await importHistory(uid, local); } catch (e) { console.error(e); }
  }
}

    setTimeout(() => {
     navigate("/");
     }, 1200);

  };

  return (
    <div className="relative min-h-screen text-white bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] flex flex-col p-6 overflow-hidden pt-18">
           <img
                    src={wavesgif}
                     alt="Background waves"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0"
            /> 
      <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-2xl p-8 shadow-xl border border-white/10 mt-12 mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div>
            <label className="text-sm text-gray-300">Name</label>
            <div className="mt-1 flex items-center bg-white/10 rounded-lg px-3">
              <User className="w-4 h-4 text-gray-300" />
              <input
                {...register("name")}
                className="w-full bg-transparent outline-none px-2 py-2 text-white"
                placeholder="Your name"
              />
            </div>
            {errors.name && <p className="text-pink-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <div className="mt-1 flex items-center bg-white/10 rounded-lg px-3">
              <Mail className="w-4 h-4 text-gray-300" />
              <input
                {...register("email")}
                className="w-full bg-transparent outline-none px-2 py-2 text-white"
                placeholder="you@example.com"
                type="email"
              />
            </div>
            {errors.email && <p className="text-pink-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <div className="mt-1 flex items-center bg-white/10 rounded-lg px-3">
              <Lock className="w-4 h-4 text-gray-300" />
              <input
                {...register("password")}
                className="w-full bg-transparent outline-none px-2 py-2 text-white"
                placeholder="••••••••"
                type={showPwd ? "text" : "password"}
              />
              <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-gray-300">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-pink-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && <div className="text-pink-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:opacity-95"
          >
            {isSubmitting ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="text-gray-300 text-sm mt-4 text-center">
          Already have an account?{" "}
          <Link to="/signin" className="text-purple-300 underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
