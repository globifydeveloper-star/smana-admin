'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/config';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            }, { withCredentials: true });

            localStorage.setItem('userInfo', JSON.stringify(data));
            Cookies.set('userInfo', JSON.stringify(data));

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
            <div className="w-[400px] bg-[#1E293B] rounded-3xl p-8 shadow-2xl border border-[#334155]/30">
                <div className="text-center mb-8">
                    {/* Logo Image */}
                    <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                        <img
                            src="/login-logo.png"
                            alt="Smana Hotel Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-wider mb-1">SMANA</h1>
                    <p className="text-[#94A3B8] text-sm font-light">Hotel Al Raffa</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-md text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#94A3B8] text-sm font-medium ml-1">Email</Label>
                        <Input
                            id="email"
                            placeholder="Enter your email address"
                            className="h-12 bg-white text-black border-none placeholder:text-gray-400 rounded-md px-4"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-[#94A3B8] text-sm font-medium ml-1">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="h-12 bg-white text-black border-none placeholder:text-gray-400 rounded-md px-4 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#D4AF37] hover:bg-[#B5952F] text-[#0F172A] font-bold rounded-full text-base transition-all mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Login as Receptionist'}
                    </Button>

                    <div className="text-center mt-6">
                        <button type="button" className="text-[#64748B] text-sm hover:text-[#94A3B8] transition-colors">
                            Forgot Password?
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
