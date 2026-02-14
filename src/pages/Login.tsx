import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import studyHero from "@/assets/study-hero.jpg";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      if (!username.trim()) {
        toast.error("Please enter a username");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim(), role);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Account created! Signing you in...");
        // Auto-confirm is enabled, so signing in right after
        const { error: loginError } = await signIn(email, password);
        if (!loginError) {
          navigate("/dashboard");
        }
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      } else {
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={studyHero} alt="Study scene" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-primary opacity-80" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-4xl font-bold text-primary-foreground mb-3">Brother's Study Companion</h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Your personal digital mentor for organized, disciplined, and confident exam preparation. 💪
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-foreground">📚 Brother's Study Companion</h1>
            <p className="text-muted-foreground mt-1">Your digital mentor system</p>
          </div>

          <Card className="shadow-elevated border-0">
            <CardHeader className="text-center pb-2">
              <h2 className="text-xl font-semibold text-foreground">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Sign in to continue your journey" : "Set up your account to get started"}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div className="space-y-2">
                      <Label>I am a</Label>
                      <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="student">🎓 Student</TabsTrigger>
                          <TabsTrigger value="admin">👨‍🏫 Admin</TabsTrigger>
                        </TabsList>
                        <TabsContent value="student">
                          <p className="text-xs text-muted-foreground text-center py-1">View study material & track progress</p>
                        </TabsContent>
                        <TabsContent value="admin">
                          <p className="text-xs text-muted-foreground text-center py-1">Manage subjects, content & student progress</p>
                        </TabsContent>
                      </Tabs>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your name" required />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required minLength={6} />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" disabled={loading}>
                  {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                >
                  {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Built with 💙 for your 10th board exam success
          </p>
        </motion.div>
      </div>
    </div>
  );
}
