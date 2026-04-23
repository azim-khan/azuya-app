'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"></div>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl bg-white/10 backdrop-blur-md text-white overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
        <CardHeader className="space-y-1 text-center pb-8">
          {process.env.NEXT_PUBLIC_APP_LOGO_URL ? (
            <div className="flex justify-center mb-4 mt-2">
              <img src={process.env.NEXT_PUBLIC_APP_LOGO_URL} alt="App Logo" className="max-h-16 object-contain" />
            </div>
          ) : (
            <CardTitle className="text-3xl font-black tracking-tight uppercase">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </CardTitle>
          )}
          <CardDescription className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">
            Accounting & Inventory Management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Username"
                  className="bg-white/5 border-white/10 pl-10 h-12 focus:border-blue-500 transition-all text-white placeholder:text-slate-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="bg-white/5 border-white/10 pl-10 h-12 focus:border-blue-500 transition-all text-white placeholder:text-slate-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-bold uppercase tracking-widest text-xs transition-all shadow-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Login'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-tighter">
              &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
